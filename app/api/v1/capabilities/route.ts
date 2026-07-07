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
        routes: ['/v1/writing/rewrite', '/v1/tera/writing/rewrite'],
      },
      {
        id: 'writing.draft',
        object: 'tera.capability',
        description: 'Draft new content from a brief (email, social post, article, etc.).',
        credits: 10,
        methods: ['POST'],
        routes: ['/v1/writing/draft', '/v1/tera/writing/draft'],
      },
      {
        id: 'coding.explain',
        object: 'tera.capability',
        description: 'Explain how a piece of code works.',
        credits: 10,
        methods: ['POST'],
        routes: ['/v1/coding/explain', '/v1/tera/coding/explain'],
      },
      {
        id: 'coding.review',
        object: 'tera.capability',
        description: 'Review code for bugs, security, performance, and best practices.',
        credits: 20,
        methods: ['POST'],
        routes: ['/v1/coding/review', '/v1/tera/coding/review'],
      },
    ],
  })
}
