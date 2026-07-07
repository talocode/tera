export const TERA_API_PRICING = {
  'writing.rewrite': 5,
  'writing.draft': 10,
  'coding.explain': 10,
  'coding.review': 20,
  'coding.write': 20,
  'chat.completions': 3,
} as const

export type TeraApiAction = keyof typeof TERA_API_PRICING

export function getPrice(action: string): number | null {
  const key = action as TeraApiAction
  if (key in TERA_API_PRICING) {
    return TERA_API_PRICING[key]
  }
  return null
}
