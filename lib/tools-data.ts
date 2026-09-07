import type { Tool } from '@/components/ToolCard'

export const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export const UniversalTool: Tool = {
    name: 'Universal Companion',
    description: 'I adapt to whatever you need - building, writing, or exploring.',
    icon: '✨',
    tags: ['Adaptive', 'Smart', 'All-Purpose']
}

export const tools: Tool[] = [
    {
        name: 'Code Builder',
        description: 'Build, debug, review, and deploy code.',
        icon: '💻',
        tags: ['Code', 'Build', 'Deploy']
    },
    {
        name: 'Content Writer',
        description: 'Draft, edit, and create polished content.',
        icon: '✍️',
        tags: ['Write', 'Draft', 'Content']
    },
    {
        name: 'Web Researcher',
        description: 'Research with cited web answers and sources.',
        icon: '🔍',
        tags: ['Research', 'Search', 'Citations']
    },
    {
        name: 'Project Planner',
        description: 'Create plans, roadmaps, and implementation strategies.',
        icon: '📋',
        tags: ['Build', 'Plan', 'Roadmap']
    },
    {
        name: 'General Assistant',
        description: 'Get clear, direct answers to any question.',
        icon: '🤖',
        tags: ['General', 'Quick', 'Answer']
    },
    {
        name: 'Group Project Generator',
        description: 'Create structured group projects with roles, timelines, and rubrics.',
        icon: '👥',
        tags: ['Collaboration', 'Projects', 'Roles']
    },
    {
        name: 'Research Agent',
        description: 'Deep web research with Context.dev and Tavily to build comprehensive reports with citations.',
        icon: '🕵️',
        tags: ['Research', 'Web', 'Deep Dive']
    },
    {
        name: 'Mind Map Maker',
        description: 'Visualize complex topics with auto-generated mind maps.',
        icon: '🧠',
        tags: ['Visual Creation', 'Organization', 'Diagrams']
    },
    {
        name: 'Spreadsheet Creator',
        description: 'Create and populate Google Sheets with data, charts, and visualizations.',
        icon: '📊',
        tags: ['Spreadsheet', 'Data', 'Charts', 'Google Sheets']
    },
    {
        name: 'Resume Builder',
        description: 'Draft and polish professional resumes and cover letters.',
        icon: '💼',
        tags: ['Career', 'Jobs', 'Writing']
    },
    {
        name: 'Idea Generator',
        description: 'Brainstorm ideas for creative writing, art, business, or just fun.',
        icon: '💡',
        tags: ['Creativity', 'Brainstorm', 'Inspiration']
    },
    {
        name: 'Data Analyst',
        description: 'Upload data files. I will analyze trends, visualize patterns, and generate insights.',
        icon: '📈',
        tags: ['Data', 'Analysis', 'Visuals']
    }
]

export const learnerTools: Tool[] = [
    {
        name: 'Blockchain Lab',
        description: 'Learn blockchain with a real Solana wallet - live balances, real transactions, and on-chain data.',
        icon: '⛓️',
        tags: ['Blockchain', 'Wallet', 'On-Chain']
    },
    {
        name: 'Skill Explorer',
        description: 'Want to explore something new? I will create a roadmap for you.',
        icon: '🗺️',
        tags: ['New Skills', 'Roadmap', 'Hobby']
    },
    {
        name: 'Deep Dive',
        description: 'Explore a topic in depth - history, science, philosophy, anything!',
        icon: '🧐',
        tags: ['Knowledge', 'Research', 'Curiosity']
    },
    {
        name: 'Book & Resource Finder',
        description: 'Get recommendations for books, videos, and articles on any topic.',
        icon: '🔎',
        tags: ['Resources', 'Reading', 'Media']
    },
    {
        name: 'Language Practice',
        description: 'Practice conversation and grammar in a new language.',
        icon: '🗣️',
        tags: ['Language', 'Conversation', 'Practice']
    },
    {
        name: 'Interview Coach',
        description: 'Practice answering common interview questions with feedback.',
        icon: '🤝',
        tags: ['Career', 'Speaking', 'Prep']
    },
    {
        name: 'Debate Partner',
        description: 'Challenge your views and strengthen your arguments on any topic.',
        icon: '⚖️',
        tags: ['Critical Thinking', 'Logic', 'Discussion']
    }
]

export const spreadsheetTools: Tool[] = [
    {
        name: 'Spreadsheet Creator',
        description: 'Create and populate Google Sheets with data, charts, and visualizations.',
        icon: '📊',
        tags: ['Spreadsheet', 'Data', 'Charts', 'Google Sheets']
    }
]

export const allTools = [...tools, ...learnerTools, ...spreadsheetTools]
