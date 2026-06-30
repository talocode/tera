import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    object: 'list',
    data: [
      {
        id: 'writing.rewrite',
        object: 'tera.capability',
        description: 'Rewrite existing text with a specified style and tone.',
        credits: 5,
        methods: ['POST'],
        route: '/v1/writing/rewrite',
      },
      {
        id: 'writing.draft',
        object: 'tera.capability',
        description: 'Draft new content from a brief (email, social post, article, etc.).',
        credits: 10,
        methods: ['POST'],
        route: '/v1/writing/draft',
      },
      {
        id: 'coding.explain',
        object: 'tera.capability',
        description: 'Explain how a piece of code works.',
        credits: 10,
        methods: ['POST'],
        route: '/v1/coding/explain',
      },
      {
        id: 'coding.review',
        object: 'tera.capability',
        description: 'Review code for bugs, security, performance, and best practices.',
        credits: 20,
        methods: ['POST'],
        route: '/v1/coding/review',
      },
    ],
  })
}
