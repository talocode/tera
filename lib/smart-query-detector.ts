/**
 * Smart Query Detector
 * Automatically detects when a query requires deep research
 */

// Keywords that indicate a need for complex research
const RESEARCH_KEYWORDS = [
    'research', 'study', 'statistics', 'data', 'report',
    'analyze', 'comprehensive', 'detailed', 'in-depth',
    'comparison', 'versus', 'vs', 'history of', 'origin of'
]

/**
 * Determines if a query should trigger a recommendation for Deep Research mode
 * @param query - The user's query
 * @returns boolean - true if deep research should be suggested
 */
export function shouldRecommendDeepResearch(query: string): boolean {
    if (!query || query.trim().length < 10) {
        return false
    }

    const normalizedQuery = query.toLowerCase().trim()

    // Check for research-oriented keywords
    return RESEARCH_KEYWORDS.some(keyword => normalizedQuery.includes(keyword))
}

/**
 * Extract key search terms for Grokipedia indexing
 * @param query - The user's query
 * @returns string - Optimized term
 */
export function optimizeGrokipediaTerm(query: string): string {
    const fillerWords = [
        'please', 'can you', 'could you', 'would you', 'i want to know',
        'tell me', 'show me', 'find me', 'help me', 'i need',
        'what about', 'regarding', 'concerning', 'about the'
    ]

    let optimized = query.toLowerCase().trim()
    for (const filler of fillerWords) {
        optimized = optimized.replace(new RegExp(filler, 'gi'), ' ')
    }

    return optimized.replace(/\s+/g, ' ').trim()
}
