import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface TgResult {
  ok: boolean
  result?: Record<string, unknown>
  description?: string
}

interface UserData {
  credits: number
  memory: Record<string, string>
  events: { date: string; title: string; id: string }[]
  apiKey?: string
}

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || ''
const TALOCODE_KEY = process.env.TALOCODE_API_KEY || ''
const BASE_URL = process.env.TALOCODE_BASE_URL || 'https://api.talocode.site'
const RESEND_KEY = process.env.RESEND_API_KEY || ''
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || ''

const TG_API = `https://api.telegram.org/bot${TG_TOKEN}`
const MISTRAL_API = 'https://api.mistral.ai/v1/chat/completions'

const DEFAULT_CREDITS = 50
const CREDIT_COST: Record<string, number> = { pdf: 5, voice: 3, email: 2 }

const store = new Map<string, UserData>()

function getUser(chatId: string): UserData {
  if (!store.has(chatId)) {
    store.set(chatId, { credits: DEFAULT_CREDITS, memory: {}, events: [] })
  }
  return store.get(chatId)!
}

async function tg(method: string, body?: Record<string, unknown>): Promise<TgResult> {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function tgFile(method: string, form: FormData): Promise<TgResult> {
  const res = await fetch(`${TG_API}/${method}`, { method: 'POST', body: form })
  return res.json()
}

function getKey(chatId: string): string | undefined {
  return getUser(chatId).apiKey || TALOCODE_KEY || undefined
}

function hasAccess(chatId: string): boolean {
  return !!getKey(chatId)
}

async function llm(
  messages: { role: string; content: string }[],
  maxTokens = 800,
  chatId?: string
): Promise<string> {
  const key = chatId ? getKey(chatId) : TALOCODE_KEY
  if (key) {
    const res = await fetch(`${BASE_URL}/v1/tera/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: maxTokens }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }
  if (MISTRAL_KEY) {
    const res = await fetch(MISTRAL_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mistral-small-latest', messages, max_tokens: maxTokens }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }
  throw new Error('No API key configured')
}

function validateKey(key: string): Promise<boolean> {
  return fetch(`${BASE_URL}/v1/tera/health`, {
    headers: { Authorization: `Bearer ${key}` },
  }).then(r => r.ok).catch(() => false)
}

// Capability keywords
const CAPABILITIES: Record<string, { name: string; desc: string; triggers: string[]; credit?: number }> = {
  chat: { name: 'Chat', desc: 'General conversation', triggers: ['chat', 'talk', 'ask', 'what', 'why', 'how', 'think', 'tell me'] },
  coding: { name: 'Code', desc: 'Write, explain, review, debug code', triggers: ['code', 'write code', 'program', 'script', 'function', 'debug', 'implement', 'build a'] },
  writing: { name: 'Write', desc: 'Draft, rewrite, compose', triggers: ['write', 'draft', 'rewrite', 'compose', 'article', 'blog', 'essay'] },
  search: { name: 'SearchLane', desc: 'Web search, news, deep research', triggers: ['search', 'find', 'look up', 'research', 'google', 'news about'], credit: 5 },
  browse: { name: 'Agent Browser', desc: 'Browse, screenshot, extract pages', triggers: ['browse', 'visit', 'screenshot', 'extract from', 'analyze page', 'check website', 'preview'], credit: 5 },
  skills: { name: 'Skills', desc: 'Generate AI skill packs from GitHub profiles, repos, docs', triggers: ['skill', 'skill pack', 'cursor skill', 'claude skill', 'github profile skill'], credit: 40 },
  invoices: { name: 'InvoiceLane', desc: 'Extract data from invoices and receipts', triggers: ['invoice', 'receipt', 'extract invoice', 'billing'], credit: 20 },
  geolane: { name: 'GeoLane', desc: 'GEO audit, domain analysis, citation readiness', triggers: ['geo', 'geolane', 'domain audit', 'seo audit', 'citation'], credit: 40 },
  verify: { name: 'VerifyLane', desc: 'Check code for secrets, security issues', triggers: ['verify', 'security check', 'scan secrets', 'code quality'], credit: 3 },
  tradia: { name: 'Tradia', desc: 'Trading plans, market analysis, signal evaluation', triggers: ['trade', 'trading', 'market', 'stock', 'signal', 'portfolio'], credit: 40 },
  cliploop: { name: 'ClipLoop', desc: 'Generate video briefs, scripts, short-form videos', triggers: ['video', 'clip', 'short', 'reel', 'tiktok', 'youtube short'], credit: 15 },
  content: { name: 'UGC Lane', desc: 'Content strategy, competitor analysis, hooks, scripts', triggers: ['content', 'ugc', 'strategy', 'hooks', 'content calendar'], credit: 30 },
  signals: { name: 'SignalLane', desc: 'X/Twitter account analysis, content plans', triggers: ['x analysis', 'twitter', 'signal x', 'x content'], credit: 30 },
  forgecad: { name: 'ForgeCAD', desc: 'Parametric CAD design, OpenSCAD, 3D printability', triggers: ['cad', 'design', '3d print', 'openscad', 'stl', 'bom'], credit: 60 },
  opensource: { name: 'OpenSourceLane', desc: 'Analyze repos, find alternatives, migration plans', triggers: ['opensource', 'repo analyze', 'migration', 'license audit'], credit: 25 },
  crawlerlane: { name: 'CrawlerLane', desc: 'AI visibility scoring, sitemap suggestions', triggers: ['crawler', 'ai visibility', 'sitemap', 'robots.txt', 'bot audit'], credit: 30 },
  webdata: { name: 'WebDataLane', desc: 'Fetch web pages, convert to markdown', triggers: ['webdata', 'fetch page', 'extract content', 'extract', 'scrape', 'markdown', 'contents from', 'convert to markdown'], credit: 5 },
  replylane: { name: 'ReplyLane', desc: 'Score reply opportunities, draft replies', triggers: ['reply', 'engagement', 'reply draft', 'social reply'], credit: 15 },
  evallane: { name: 'EvalLane', desc: 'Run evaluation suites, score LLM outputs', triggers: ['eval', 'evaluate', 'test llm', 'score output'], credit: 5 },
  policylane: { name: 'PolicyLane', desc: 'Check actions against policy, redact secrets', triggers: ['policy', 'allow', 'deny', 'check action', 'redact'], credit: 2 },
  email: { name: 'Email', desc: 'Send emails', triggers: ['email', 'send email', 'mail', 'send mail', 'send to'] },
  pdf: { name: 'PDF Gen', desc: 'Generate PDF documents', triggers: ['pdf', 'generate pdf', 'create pdf', 'make pdf', 'document pdf'], credit: 5 },
  weather: { name: 'Weather/Time', desc: 'Weather and time info', triggers: ['weather', 'temperature', 'forecast', 'what time', 'current time', 'time in', 'date today'] },
  calendar: { name: 'Calendar', desc: 'Manage events — add, list, delete', triggers: ['calendar', 'event', 'schedule', 'remind me', 'appointment'] },
  memory: { name: 'Memory', desc: 'Remember facts about you — store and recall', triggers: ['remember', 'remember that', 'do you remember', 'my name is', 'i like', 'store', 'recall', 'what do you know'] },
  voice: { name: 'Voice', desc: 'Text to speech', triggers: ['voice', 'say', 'speak', 'read aloud', 'text to speech', 'tts', 'audio'], credit: 3 },
}

function routeIntent(text: string, chatId?: string): string {
  const lower = text.toLowerCase()
  for (const [key, cap] of Object.entries(CAPABILITIES)) {
    for (const t of cap.triggers) {
      if (lower.includes(t)) return key
    }
  }
  return 'chat'
}

async function routeIntentLLM(text: string, chatId?: string): Promise<string> {
  const lower = text.toLowerCase()
  for (const [key, cap] of Object.entries(CAPABILITIES)) {
    for (const t of cap.triggers) {
      if (lower.includes(t)) return key
    }
  }
  const capDescs = Object.entries(CAPABILITIES)
    .filter(([k]) => k !== 'chat')
    .map(([k, cap]) => `"${k}": ${cap.name} — ${cap.desc}`)
    .join('\n')
  const prompt = `You are a classifier. Given a user message, pick the single best capability from the list below. If none fit, answer "chat". Reply with ONLY a single word — the capability key.\n\n${capDescs}\n\nUser: ${text}`
  try {
    const reply = await llm([{ role: 'user', content: prompt }], 20, chatId)
    const cleaned = reply.trim().toLowerCase().replace(/\.$/, '')
    if (cleaned in CAPABILITIES) return cleaned
  } catch { /* fall through */ }
  return 'chat'
}

function makePdf(title: string, body: string): string {
  const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\n/g, ')\\Tj\nTd (')
  const lines = body.split('\n')
  let y = 720
  const streamParts = [`BT /F1 14 Tf 50 750 Td (${esc(title.slice(0, 80))}) Tj ET`]
  for (const line of lines) {
    if (y < 50) break
    streamParts.push(`BT /F1 10 Tf 50 ${y} Td (${esc(line.slice(0, 100))}) Tj ET`)
    y -= 14
  }
  const stream = streamParts.join('\n')
  const streamLen = Buffer.byteLength(stream, 'latin1')
  const header = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ${streamLen}>>stream\n${stream}\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Courier>>endobj\nxref\n0 6\n0000000000 65535 f \r\n`
  const offset = Buffer.byteLength(header, 'latin1')
  const trailer = `0000000009 00000 n \r\n0000000058 00000 n \r\n0000000115 00000 n \r\n0000000266 00000 n \r\n0000000${378 + streamLen} 00000 n \r\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n${offset}\n%%EOF`
  return header + trailer
}

function cleanMd(text: string): string {
  return text.replace(/^#{1,6}\s+/gm, '').replace(/^[-*]{3,}\s*$/gm, '---').trim()
}

async function sendMsg(chatId: number, text: string, extra?: Record<string, unknown>) {
  await tg('sendMessage', { chat_id: chatId, text: cleanMd(text), parse_mode: 'Markdown', ...extra })
}

async function handleMessage(chatId: number, text: string, username: string) {
  const uid = String(chatId)
  const user = getUser(uid)
  const isAdmin = ADMIN_CHAT_ID === uid

  console.log(`${username}: ${text}`)

  // Commands
  if (text === '/start') {
    return sendMsg(chatId, `Hello ${username}! I'm *TeraAI* — the Talocode AI infrastructure agent. I can help with coding, writing, search, browsing, trading, content, and more. Try /caps to see everything I can do.`)
  }

  if (text === '/caps' || text === '/capabilities') {
    const keyStatus = hasAccess(uid) ? '✅' : '🔑'
    const lines = [`*TeraAI — Capabilities*  |  \`${user.credits}cr\`  ${keyStatus}\n`]
    for (const [, cap] of Object.entries(CAPABILITIES)) {
      const credStr = cap.credit ? ` (${cap.credit}cr)` : ''
      const needsKey = cap.credit && !hasAccess(uid) ? ' 🔑' : ''
      lines.push(`• **${cap.name}**${credStr} — ${cap.desc}${needsKey}`)
    }
    lines.push('\nJust describe what you need in natural language!')
    return sendMsg(chatId, lines.join('\n'))
  }

  if (text === '/balance') {
    return sendMsg(chatId, `💰 Your balance: **${user.credits}cr**\n\nPDF: 5cr | Voice: 3cr | Email: 2cr`)
  }

  if (text.startsWith('/login')) {
    const parts = text.split(' ')
    if (parts.length < 2) return sendMsg(chatId, 'Usage: `/login <your_talocode_api_key>`\nGet one at dashboard.talocode.site')
    const key = parts[1]
    if (await validateKey(key)) {
      user.apiKey = key
      return sendMsg(chatId, '✅ Authenticated! Your TALOCODE_API_KEY is active. Try /caps to see available capabilities.')
    }
    return sendMsg(chatId, '❌ Invalid API key. Get one at dashboard.talocode.site')
  }

  if (text === '/logout') {
    if (user.apiKey) {
      user.apiKey = undefined
      return sendMsg(chatId, '🔓 Logged out.')
    }
    return sendMsg(chatId, "You're not logged in.")
  }

  if (text.startsWith('/topup') && isAdmin) {
    const parts = text.split(' ')
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      user.credits += parseInt(parts[1])
      return sendMsg(chatId, `💰 Topped up ${parts[1]}cr. Balance: ${user.credits}cr`)
    }
    return sendMsg(chatId, 'Usage: /topup <amount>')
  }

  if (text.startsWith('/grant') && isAdmin) {
    const parts = text.split(' ')
    if (parts.length === 3 && /^\d+$/.test(parts[2])) {
      const target = getUser(parts[1])
      target.credits += parseInt(parts[2])
      return sendMsg(chatId, `✅ Granted ${parts[2]}cr to user ${parts[1]}`)
    }
    return sendMsg(chatId, 'Usage: /grant <chat_id> <amount>')
  }

  if (text === '/help') {
    const keyStatus = TALOCODE_KEY ? 'set' : 'missing — get one at dashboard.talocode.site'
    return sendMsg(chatId,
      '*TeraAI — Infrastructure Agent*\n\n'
      + '/start — Intro\n/caps — Show all capabilities\n/balance — Credits\n/login `<key>` — Authenticate with TALOCODE_API_KEY\n/logout — Remove API key\n/help — This help\n\n'
      + 'Just describe what you need — I\'ll route to the right capability.\n'
      + 'Examples:\n'
      + '• "search for latest AI news"\n'
      + '• "write a python script to sort files"\n'
      + '• "browse https://example.com"\n'
      + '• "analyze my trading portfolio"\n'
      + '• "generate a video brief for a product launch"\n'
      + '• "scan this code for secrets"\n\n'
      + `TALOCODE_API_KEY: ${keyStatus}`
    )
  }

  // Route intent (keyword match, fallback to LLM)
  let intent = routeIntent(text, uid)
  if (intent === 'chat' && text.length > 10) {
    intent = await routeIntentLLM(text, uid)
  }
  console.log(`  -> intent: ${intent}`)

  await tg('sendChatAction', { chat_id: chatId, action: 'typing' })

  // Handle capability
  if (intent === 'memory') {
    try {
      const resp = await llm([
        { role: 'system', content: 'Extract memory action. Reply with ONLY JSON: {"action":"store"|"recall", "key":"...", "value":"..."}' },
        { role: 'user', content: text },
      ], 200, uid)
      const cmd = JSON.parse(resp)
      if (cmd.action === 'store' && cmd.key) {
        user.memory[cmd.key] = cmd.value || ''
        return sendMsg(chatId, `🧠 Got it! **${cmd.key}**: ${cmd.value || ''}`)
      } else {
        const entries = Object.entries(user.memory)
        if (entries.length) {
          return sendMsg(chatId, '*What I know:*\n' + entries.map(([k, v]) => `• **${k}**: ${v}`).join('\n'))
        }
        return sendMsg(chatId, "I don't know anything yet. Say *remember my name is Abdulmuiz* to teach me!")
      }
    } catch {
      return sendMsg(chatId, 'Memory error. Try: *remember my name is Abdulmuiz*')
    }
  }

  if (intent === 'calendar') {
    try {
      const resp = await llm([
        { role: 'system', content: 'Extract calendar action. Reply with ONLY JSON: {"action":"add"|"list", "date":"...", "title":"..."}' },
        { role: 'user', content: text },
      ], 200, uid)
      const cmd = JSON.parse(resp)
      if (cmd.action === 'add' && cmd.title) {
        user.events.push({ date: cmd.date || 'today', title: cmd.title, id: String(Date.now()) })
        return sendMsg(chatId, `✅ Event added: **${cmd.title}** on ${cmd.date || 'today'}`)
      } else {
        if (user.events.length) {
          return sendMsg(chatId, '*Your Events:*\n' + user.events.slice(-10).map(e => `• ${e.date} — ${e.title}`).join('\n'))
        }
        return sendMsg(chatId, 'No events yet. Say *remember meeting on Friday* to add one.')
      }
    } catch {
      return sendMsg(chatId, 'Calendar error.')
    }
  }

  if (intent === 'weather') {
    const match = text.match(/\b(?:in|for|at)\s+([a-zA-Z\s]+?)(?:\?|$)/)
    if (match) {
      const city = match[1].trim()
      try {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%h+%w`)
        const weather = await res.text()
        return sendMsg(chatId, `📍 *${city}*\n🌤 ${weather.trim()}`)
      } catch {
        return sendMsg(chatId, 'Weather unavailable.')
      }
    }
    const now = new Date().toLocaleString()
    return sendMsg(chatId, `🕐 Current time: \`${now}\`\n\n_Say "weather in London" for a city._`)
  }

  if (intent === 'pdf') {
    const cost = CREDIT_COST.pdf || 5
    if (user.credits < cost) return sendMsg(chatId, `⚠️ PDF generation costs ${cost}cr. You have ${user.credits}cr.`)
    const lines = text.split('\n')
    const title = lines.length > 1 ? lines[0].slice(0, 100) : 'Document'
    const body = lines.length > 1 ? lines.slice(1).join('\n') : text
    const pdfData = makePdf(title, body)
    const buf = Buffer.from(pdfData, 'latin1')
    const form = new FormData()
    form.append('chat_id', String(chatId))
    form.append('document', new Blob([buf], { type: 'application/pdf' }), 'document.pdf')
    form.append('caption', `Remaining: ${user.credits - cost}cr`)
    const result = await tgFile('sendDocument', form)
    if (result.ok) {
      user.credits -= cost
    } else {
      return sendMsg(chatId, `❌ PDF send failed: ${result.description || ''}`)
    }
    return
  }

  if (intent === 'voice') {
    const cost = CREDIT_COST.voice || 3
    if (user.credits < cost) return sendMsg(chatId, `⚠️ Voice generation costs ${cost}cr. You have ${user.credits}cr.`)
    const textToSay = text.replace(/^(say|speak|voice)\s+/i, '').slice(0, 500)
    const res = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSay)}&tl=en&client=tw-ob`
    )
    const audioBuf = Buffer.from(await res.arrayBuffer())
    const form = new FormData()
    form.append('chat_id', String(chatId))
    form.append('voice', new Blob([audioBuf], { type: 'audio/mpeg' }), 'voice.mp3')
    const result = await tgFile('sendVoice', form)
    if (result.ok) {
      user.credits -= cost
    } else {
      form.delete('voice')
      form.append('audio', new Blob([audioBuf], { type: 'audio/mpeg' }), 'voice.mp3')
      const r2 = await tgFile('sendAudio', form)
      if (r2.ok) user.credits -= cost
    }
    return
  }

  if (intent === 'email') {
    const cost = CREDIT_COST.email || 2
    if (!RESEND_KEY) return sendMsg(chatId, '⚠️ RESEND_API_KEY not configured.')
    if (user.credits < cost) return sendMsg(chatId, `⚠️ Sending email costs ${cost}cr. You have ${user.credits}cr.`)
    try {
      const resp = await llm([
        { role: 'system', content: 'Extract email details. Reply with ONLY JSON: {"to":"...", "subject":"...", "body":"..."}. Default to: abdulmuizproject@gmail.com' },
        { role: 'user', content: text },
      ], 300, uid)
      const details = JSON.parse(resp)
      const to = details.to || 'abdulmuizproject@gmail.com'
      if (!to.includes('@')) return sendMsg(chatId, 'Need a valid email address.')
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: RESEND_FROM, to: [to], subject: details.subject || 'No subject', text: details.body || '' }),
      })
      const data = await res.json()
      if (res.ok) {
        user.credits -= cost
        return sendMsg(chatId, `✅ Email sent to **${to}**\nSubject: ${details.subject || 'No subject'}\nRemaining: ${user.credits}cr`)
      }
      return sendMsg(chatId, `❌ ${data.message || JSON.stringify(data)}`)
    } catch (e) {
      return sendMsg(chatId, `Email error: ${e}`)
    }
  }

  // API capabilities (need key)
  const cap = CAPABILITIES[intent]
  if (cap?.credit && !hasAccess(uid)) {
    return sendMsg(chatId, `🔑 **${cap.name}** costs ${cap.credit}cr. Authenticate with /login <your_key>`)
  }

  if (cap?.credit && user.credits < cap.credit) {
    return sendMsg(chatId, `⚠️ ${cap.name} costs ${cap.credit}cr. You have ${user.credits}cr.`)
  }

  // Capability with API endpoint
  const API_CAPS: Record<string, { path: string; bodyKey: string }> = {
    search: { path: '/v1/searchlane/query', bodyKey: 'query' },
    browse: { path: '/v1/agent-browser/check', bodyKey: 'url' },
    skills: { path: '/v1/skills/generate/text', bodyKey: 'text' },
    invoices: { path: '/v1/invoicelane/extract', bodyKey: 'text' },
    geolane: { path: '/v1/geolane/audit', bodyKey: 'domain' },
    verify: { path: '/v1/verifylane/secrets', bodyKey: 'text' },
    tradia: { path: '/v1/tradia/agent/plan', bodyKey: 'brief' },
    cliploop: { path: '/v1/cliploop/brief/generate', bodyKey: 'brief' },
    content: { path: '/v1/ugclane/strategy/generate', bodyKey: 'brief' },
    signals: { path: '/v1/signallane/x/analyze', bodyKey: 'username' },
    forgecad: { path: '/v1/forgecad/design/generate', bodyKey: 'task' },
    opensource: { path: '/v1/opensourcelane/repo/analyze', bodyKey: 'repo_url' },
    crawlerlane: { path: '/v1/crawlerlane/ai-visibility/score', bodyKey: 'url' },
    webdata: { path: '/v1/webdatalane/fetch', bodyKey: 'query' },
    replylane: { path: '/v1/replylane/opportunity/score', bodyKey: 'text' },
    evallane: { path: '/v1/evallane/suite', bodyKey: 'text' },
    policylane: { path: '/v1/policylane/check', bodyKey: 'text' },
  }

  const apiCap = API_CAPS[intent]
  if (apiCap) {
    const key = getKey(uid)
    if (!key) return sendMsg(chatId, '🔑 Requires a TALOCODE_API_KEY. Use /login')
    try {
      const body = { [apiCap.bodyKey]: text }
      const res = await fetch(`${BASE_URL}${apiCap.path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (cap.credit) user.credits -= cap.credit
      return sendMsg(chatId, `*${cap.name}* result:\n\`\`\`\n${JSON.stringify(data, null, 2).slice(0, 3000)}\n\`\`\``)
    } catch (e) {
      return sendMsg(chatId, `Error: ${e}`)
    }
  }

  // Default: chat via LLM
  try {
    const reply = await llm([
      {
        role: 'system',
        content: 'You are TeraAI — an AI assistant. Be concise and helpful. Use Markdown. Do NOT use headings (#).',
      },
      { role: 'user', content: text },
    ], 800, uid)
    await sendMsg(chatId, reply)
    console.log(`  -> reply: ${reply.slice(0, 150)}...`)
  } catch (e) {
    await sendMsg(chatId, `Error: ${e}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    const msg = update.message || update.channel_post
    if (!msg) return NextResponse.json({ ok: true })

    const chatId = msg.chat.id
    const text = (msg.text || '').trim()
    const username = msg.from?.first_name || msg.from?.username || 'User'

    if (text) {
      await handleMessage(chatId, text, username)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
