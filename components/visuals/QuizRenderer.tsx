'use client'

import React, { useState } from 'react'

// Types matching lib/quiz.ts
type QuizQuestionType = 'multiple_choice' | 'short_answer' | 'true_false'

interface QuizQuestion {
    id: number
    type: QuizQuestionType
    question: string
    options?: string[]
    correct: number | string
    explanation?: string
}

interface Quiz {
    action: 'quiz'
    topic: string
    questions: QuizQuestion[]
}

interface QuizResult {
    questionId: number
    correct: boolean
    userAnswer: number | string
    correctAnswer: number | string
    explanation?: string
}

interface QuizGradingResult {
    score: number
    total: number
    percentage: number
    results: QuizResult[]
    feedback: string
}

interface QuizRendererProps {
    quiz: Quiz
    onComplete?: (result: QuizGradingResult) => void
}

export default function QuizRenderer({ quiz, onComplete }: QuizRendererProps) {
    const [answers, setAnswers] = useState<Record<number, number | string>>({})
    const [submitted, setSubmitted] = useState(false)
    const [gradingResult, setGradingResult] = useState<QuizGradingResult | null>(null)
    const [currentQuestion, setCurrentQuestion] = useState(0)

    const handleAnswerChange = (questionId: number, answer: number | string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    const handleSubmit = async () => {
        // Grade the quiz locally (matching lib/quiz.ts gradeQuiz logic)
        const results: QuizResult[] = []
        let correctCount = 0

        for (const question of quiz.questions) {
            const userAnswer = answers[question.id]

            if (userAnswer === undefined) {
                results.push({
                    questionId: question.id,
                    correct: false,
                    userAnswer: 'No answer',
                    correctAnswer: question.correct,
                    explanation: question.explanation
                })
                continue
            }

            let isCorrect = false

            if (question.type === 'short_answer') {
                const userStr = String(userAnswer).toLowerCase().trim()
                const correctStr = String(question.correct).toLowerCase().trim()
                isCorrect = userStr === correctStr ||
                    correctStr.includes(userStr) ||
                    userStr.includes(correctStr)
            } else {
                isCorrect = userAnswer === question.correct
            }

            if (isCorrect) correctCount++

            results.push({
                questionId: question.id,
                correct: isCorrect,
                userAnswer,
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
            feedback = "💪 Don't give up! This topic needs more practice."
        }

        const result: QuizGradingResult = {
            score: correctCount,
            total,
            percentage,
            results,
            feedback
        }

        setGradingResult(result)
        setSubmitted(true)
        onComplete?.(result)
    }

    const answeredCount = Object.keys(answers).length
    const progress = (answeredCount / quiz.questions.length) * 100

    if (submitted && gradingResult) {
        return (
            <div className="bg-tera-panel/50 rounded-xl p-6 border border-tera-border">
                {/* Results Header */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-tera-primary mb-2">
                        Quiz Complete: {quiz.topic}
                    </h3>
                    <div className="text-4xl font-bold mb-2">
                        <span className={gradingResult.percentage >= 60 ? 'text-green-400' : 'text-orange-400'}>
                            {gradingResult.score}/{gradingResult.total}
                        </span>
                        <span className="text-tera-secondary text-lg ml-2">
                            ({gradingResult.percentage}%)
                        </span>
                    </div>
                    <p className="text-tera-secondary">{gradingResult.feedback}</p>
                </div>

                {/* Score Bar */}
                <div className="w-full h-3 bg-tera-border rounded-full mb-6 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${gradingResult.percentage >= 60 ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                        style={{ width: `${gradingResult.percentage}%` }}
                    />
                </div>

                {/* Question Results */}
                <div className="space-y-4">
                    {gradingResult.results.map((result, idx) => {
                        const question = quiz.questions.find(q => q.id === result.questionId)
                        if (!question) return null

                        return (
                            <div
                                key={result.questionId}
                                className={`p-4 rounded-lg border ${result.correct
                                    ? 'border-green-500/30 bg-green-500/10'
                                    : 'border-red-500/30 bg-red-500/10'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`text-lg ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.correct ? '✓' : '✗'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-tera-primary font-medium mb-2">
                                            {idx + 1}. {question.question}
                                        </p>

                                        {!result.correct && (
                                            <p className="text-sm text-red-400 mb-1">
                                                Your answer: {
                                                    question.type === 'multiple_choice' || question.type === 'true_false'
                                                        ? question.options?.[result.userAnswer as number] || result.userAnswer
                                                        : result.userAnswer
                                                }
                                            </p>
                                        )}

                                        <p className="text-sm text-green-400 mb-2">
                                            Correct: {
                                                question.type === 'multiple_choice' || question.type === 'true_false'
                                                    ? question.options?.[result.correctAnswer as number]
                                                    : result.correctAnswer
                                            }
                                        </p>

                                        {result.explanation && (
                                            <p className="text-sm text-tera-secondary italic whitespace-pre-wrap">
                                                💡 {result.explanation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Retry Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setAnswers({})
                            setSubmitted(false)
                            setGradingResult(null)
                            setCurrentQuestion(0)
                        }}
                        className="px-6 py-2 bg-tera-neon/20 hover:bg-tera-neon/30 text-tera-neon rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-tera-panel/50 rounded-xl p-6 border border-tera-border">
            {/* Quiz Header */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-tera-primary mb-2">
                    📝 Quiz: {quiz.topic}
                </h3>
                <p className="text-sm text-tera-secondary mb-3">
                    {quiz.questions.length} questions • Answer all to submit
                </p>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-tera-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-tera-neon transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-tera-secondary mt-1">
                    {answeredCount} of {quiz.questions.length} answered
                </p>
            </div>

            {/* Questions */}
            <div className="space-y-6">
                {quiz.questions.map((question, idx) => (
                    <div
                        key={question.id}
                        className="p-4 rounded-lg bg-black/20 border border-tera-border/50"
                    >
                        <div className="text-tera-primary font-medium mb-3 whitespace-pre-wrap">
                            <span className="text-tera-neon">{idx + 1}.</span> {question.question}
                        </div>

                        {/* Multiple Choice / True-False */}
                        {(question.type === 'multiple_choice' || question.type === 'true_false') && question.options && (
                            <div className="space-y-2">
                                {question.options.map((option, optIdx) => (
                                    <label
                                        key={optIdx}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${answers[question.id] === optIdx
                                            ? 'bg-tera-neon/20 border-tera-neon'
                                            : 'bg-black/20 border-transparent hover:bg-white/[0.06]'
                                            } border`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            checked={answers[question.id] === optIdx}
                                            onChange={() => handleAnswerChange(question.id, optIdx)}
                                            className="w-4 h-4 text-tera-neon accent-current"
                                        />
                                        <span className="text-tera-primary">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Short Answer */}
                        {question.type === 'short_answer' && (
                            <input
                                type="text"
                                value={String(answers[question.id] || '')}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                placeholder="Type your answer..."
                                className="w-full p-3 bg-black/30 border border-tera-border rounded-lg text-tera-primary placeholder:text-tera-secondary/50 focus:outline-none focus:border-tera-neon"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={answeredCount < quiz.questions.length}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${answeredCount === quiz.questions.length
                        ? 'bg-tera-neon text-black hover:bg-tera-neon/80'
                        : 'bg-tera-border text-tera-secondary cursor-not-allowed'
                        }`}
                >
                    {answeredCount === quiz.questions.length
                        ? 'Submit Quiz'
                        : `Answer ${quiz.questions.length - answeredCount} more`}
                </button>
            </div>
        </div>
    )
}
