/**
 * Quiz Generation and Grading Library
 * Generates practice quizzes from topics and grades user answers
 */

import { talocodeChatCompletion } from './talocode'
import { supabaseServer } from './supabase-server'

// Quiz question types
export type QuizQuestionType = 'multiple_choice' | 'short_answer' | 'true_false'

export interface QuizQuestion {
    id: number
    type: QuizQuestionType
    question: string
    options?: string[] // For multiple choice
    correct: number | string // Index for MC, string for short answer
    explanation?: string
}

export interface Quiz {
    action: 'quiz'
    topic: string
    questions: QuizQuestion[]
}

export interface QuizAnswer {
    questionId: number
    answer: number | string
}

export interface QuizResult {
    questionId: number
    correct: boolean
    userAnswer: number | string
    correctAnswer: number | string
    explanation?: string
}

export interface QuizGradingResult {
    score: number
    total: number
    percentage: number
    results: QuizResult[]
    feedback: string
}

/**
 * Generate a quiz on a given topic
 */
export async function generateQuiz(
    topic: string,
    questionCount: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<Quiz> {
    const difficultyDescriptions = {
        easy: 'basic recall and simple concepts',
        medium: 'understanding and application of concepts',
        hard: 'analysis, synthesis, and complex problem-solving'
    }

    const prompt = `Generate a quiz on the topic: "${topic}"

Create exactly ${questionCount} questions with ${difficultyDescriptions[difficulty]}.

Mix of question types:
- Multiple choice (4 options each)
- True/False
- Short answer (1-3 word answers)

Return ONLY valid JSON in this exact format:
{
  "action": "quiz",
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Your question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct"
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "Statement to evaluate as true or false?",
      "options": ["True", "False"],
      "correct": 0,
      "explanation": "Brief explanation"
    },
    {
      "id": 3,
      "type": "short_answer",
      "question": "Question requiring a short text answer?",
      "correct": "answer",
      "explanation": "Brief explanation"
    }
  ]
}

IMPORTANT:
- For multiple_choice: "correct" is the 0-based index of the correct option
- For true_false: "correct" is 0 for True, 1 for False
- For short_answer: "correct" is the expected answer string (lowercase)
- Always include an explanation
- Make questions educational and clear`

    const data = await talocodeChatCompletion({
        model: 'default',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
    })
    const content = data.choices?.[0]?.message?.content

    if (!content) {
        throw new Error('Failed to generate quiz')
    }

    try {
        const quiz = JSON.parse(content) as Quiz
        return quiz
    } catch (e) {
        console.error('Failed to parse quiz JSON:', e)
        throw new Error('Failed to parse quiz response')
    }
}

/**
 * Grade a quiz submission
 */
export function gradeQuiz(quiz: Quiz, answers: QuizAnswer[]): QuizGradingResult {
    const results: QuizResult[] = []
    let correctCount = 0

    for (const question of quiz.questions) {
        const userAnswer = answers.find(a => a.questionId === question.id)

        if (!userAnswer) {
            results.push({
                questionId: question.id,
                correct: false,
                userAnswer: 'No answer provided',
                correctAnswer: question.correct,
                explanation: question.explanation
            })
            continue
        }

        let isCorrect = false

        if (question.type === 'short_answer') {
            // Fuzzy match for short answers
            const userStr = String(userAnswer.answer).toLowerCase().trim()
            const correctStr = String(question.correct).toLowerCase().trim()
            isCorrect = userStr === correctStr ||
                correctStr.includes(userStr) ||
                userStr.includes(correctStr)
        } else {
            // Exact match for multiple choice and true/false
            isCorrect = userAnswer.answer === question.correct
        }

        if (isCorrect) correctCount++

        results.push({
            questionId: question.id,
            correct: isCorrect,
            userAnswer: userAnswer.answer,
            correctAnswer: question.correct,
            explanation: question.explanation
        })
    }

    const total = quiz.questions.length
    const percentage = Math.round((correctCount / total) * 100)

    let feedback = ''
    if (percentage === 100) {
        feedback = '🎉 Perfect score! You really know this topic!'
    } else if (percentage >= 80) {
        feedback = '🌟 Great job! You have a solid understanding.'
    } else if (percentage >= 60) {
        feedback = '👍 Good effort! Review the explanations to strengthen your knowledge.'
    } else if (percentage >= 40) {
        feedback = '📚 Keep studying! Focus on the areas you missed.'
    } else {
        feedback = '💪 Don\'t give up! This topic needs more practice. Want me to explain the concepts?'
    }

    return {
        score: correctCount,
        total,
        percentage,
        results,
        feedback
    }
}

/**
 * Save quiz result to database for progress tracking
 */
export async function saveQuizResult(
    userId: string,
    topic: string,
    score: number,
    total: number
): Promise<void> {
    try {
        await supabaseServer.from('quiz_results').insert({
            user_id: userId,
            topic,
            score,
            total,
            created_at: new Date()
        })
    } catch (error) {
        console.error('Error saving quiz result:', error)
    }
}

/**
 * Get user's quiz history for a topic
 */
export async function getQuizHistory(
    userId: string,
    topic?: string
): Promise<{ topic: string; score: number; total: number; created_at: string }[]> {
    let query = supabaseServer
        .from('quiz_results')
        .select('topic, score, total, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

    if (topic) {
        query = query.ilike('topic', `%${topic}%`)
    }

    const { data } = await query
    return data || []
}

/**
 * Get user's overall quiz stats
 */
export async function getQuizStats(userId: string): Promise<{
    totalQuizzes: number
    averageScore: number
    topTopics: string[]
}> {
    const { data } = await supabaseServer
        .from('quiz_results')
        .select('topic, score, total')
        .eq('user_id', userId)

    if (!data || data.length === 0) {
        return { totalQuizzes: 0, averageScore: 0, topTopics: [] }
    }

    const totalQuizzes = data.length
    const avgPercentage = data.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / totalQuizzes

    // Count topics and find most common
    const topicCounts: Record<string, number> = {}
    for (const quiz of data) {
        topicCounts[quiz.topic] = (topicCounts[quiz.topic] || 0) + 1
    }
    const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic)

    return {
        totalQuizzes,
        averageScore: Math.round(avgPercentage),
        topTopics
    }
}
