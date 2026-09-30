export type NewsPost = {
  slug: string
  date: string
  title: string
  summary: string
  body: string[]
}

export const newsPosts: NewsPost[] = [
  {
    slug: 'wallet-reads',
    date: '30 September 2026',
    title: 'Wallet balances no longer fail on unlock',
    summary: 'Unlocking Tera Wallet was hitting a Solana endpoint that answers the browser with 403. Reads now use public endpoints that respond, and an empty wallet stays empty.',
    body: [
      'After the passcode, Home asked Solana’s official mainnet endpoint for the balance and for recent activity. That endpoint returns HTTP 403, Access forbidden, to the browser. The wallet showed that error instead of a balance.',
      'The wallet now tries public mainnet endpoints that allow these reads, and it skips one that answers 403, 429, or “request blocked”. SOL still shows if a token-account index is refused. A zero balance is a real zero. No transactions means an empty activity list, not a fake history.',
      'The same day, production caught up with the 29 September shell: the mark stays visible in dark and light, the account button stays pinned, the sidebar and composer menu are smaller, the news archive is complete, the lab wallet connect waits for the extension, and the public wallet API is on /v1/wallet. Keys, seeds, and the passcode still never leave the browser.',
      'One of those publishes had been blocked. The theme change dropped the QuickSwitcher import, so the production build died while rendering /auth/error and Netlify kept the previous deploy. The import is restored. A separate GitHub upload check can stay red when its Netlify token is expired. The live site is the deploy Netlify itself published.',
    ],
  },
  {
    slug: 'tera-wallet',
    date: '29 September 2026',
    title: 'Tera Wallet is live',
    summary: 'A self-custodial Solana wallet for SOL, SPL tokens, and official $TCODE. The recovery phrase stays in your browser.',
    body: [],
  },
  {
    slug: 'tcode-name',
    date: '19 September 2026',
    title: 'Official $TCODE is Talocode',
    summary: 'The public token name is Talocode. The wallet and the lab both use the same mainnet mint.',
    body: [
      'Talocode is the public name of $TCODE. The mint is 6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory on Solana mainnet, with 6 decimals.',
      'Tera Wallet and the Blockchain Lab read that mint. They do not invent a second token, and they do not show a balance that the chain did not return.',
    ],
  },
  {
    slug: 'ai-platform',
    date: '7 September 2026',
    title: 'Tera is an AI platform',
    summary: 'Tera moved from a learning companion to a workspace for building, writing, search, and shipping real work.',
    body: [
      'The product is no longer only a study tool. Chat, search, images, skills, and the blockchain lab now sit in one workspace.',
      'Answers are meant to be direct and usable. Modes cover general help, code, writing, search, and building.',
    ],
  },
  {
    slug: 'blockchain-lab',
    date: '30 August 2026',
    title: 'Blockchain Lab reads live Solana',
    summary: 'The lab connects a real wallet, shows live balances, and can prepare a real SOL send.',
    body: [
      'Blockchain Lab is not a simulation. Connect Phantom, Solflare, or Backpack, sign a challenge, and Tera links that public address to your account.',
      'Balances and recent activity come from Solana mainnet. A failed read stays failed. The lab never asks for a seed phrase.',
    ],
  },
  {
    slug: 'talocode-cloud',
    date: '30 August 2026',
    title: 'Model calls go through Talocode Cloud',
    summary: 'Tera routes generation through Talocode, with a direct fallback when the gateway is busy.',
    body: [
      'Chat no longer depends on a single provider call. When Talocode Cloud is rate-limited, Tera retries and then uses the configured fallback model.',
      'The old “AI service high traffic” system line is not a successful answer.',
    ],
  },
  {
    slug: 'credits-and-gmail',
    date: '16 July 2026',
    title: 'Credits, Gmail, and auto top-up',
    summary: 'Usage is metered in credits, with Gmail connected and an auto top-up path when a plan runs low.',
    body: [
      'Plans spend credits instead of an invisible quota. Usage, burn, and top-up live under Settings.',
      'Gmail can be connected for the workflows that need it. Auto top-up is optional and stays on the billing settings you save.',
    ],
  },
  {
    slug: 'python-sdk',
    date: '12 July 2026',
    title: 'Python SDK and CLI',
    summary: 'talocode-tera on PyPI, plus a CLI, so the same capabilities are usable outside the website.',
    body: [
      'The Python package talks to the Tera API. The CLI is for the same calls from a terminal.',
      'Wallet lookups on that API are public reads only. They reject seeds and private keys.',
    ],
  },
  {
    slug: 'tera-api',
    date: '30 June 2026',
    title: 'Tera API v0.1',
    summary: 'Writing, coding, and chat shipped as product capabilities, then namespaced under Talocode Cloud.',
    body: [
      'The first API covered rewrite, draft, explain, review, and later write and chat completions.',
      'Tera Wallet is now on the same capability list at /v1/tera/wallet. GET returns the product facts. POST with an address returns public SOL and $TCODE balances.',
    ],
  },
  {
    slug: 'tera-browser',
    date: '18 June 2026',
    title: 'Tera Browser',
    summary: 'A browser surface for web context, with Firecrawl and a normalized page layer.',
    body: [
      'Tera Browser is separate from Tera Desktop. It fetches pages, normalizes them, and can hand that context to an answer.',
      'Firecrawl is one provider. If it fails, the app can fall back instead of inventing the page.',
    ],
  },
  {
    slug: 'codra-auth',
    date: '19 June 2026',
    title: 'Codra device sign-in',
    summary: 'Device-code login for Codra, with the redirect you started from.',
    body: [
      'Codra can sign in through a device code instead of a pasted token.',
      'The sign-in and sign-up pages keep the redirect you asked for, so the client lands back where it started.',
    ],
  },
  {
    slug: 'telegram-agent',
    date: '19 July 2026',
    title: 'Tera on Telegram',
    summary: 'The same capabilities, including Tera Wallet, are available from the Telegram agent.',
    body: [
      'The Telegram agent routes a message to a capability: search, code, writing, browse, and now Tera Wallet.',
      'Ask it to open the wallet or to read a public Solana address. Do not send it a recovery phrase. It will refuse.',
    ],
  },
]

export function getNewsPost(slug: string) {
  return newsPosts.find((post) => post.slug === slug) ?? null
}
