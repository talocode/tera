import os, time, json, requests, re, io, datetime as dt
from pathlib import Path

TERA_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = TERA_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)
MEMORY_FILE = DATA_DIR / "memory.json"
CALENDAR_FILE = DATA_DIR / "calendar.json"
CREDITS_FILE = DATA_DIR / "credits.json"
KEY_FILE = DATA_DIR / "talocode_keys.json"
DEFAULT_FREE_CREDITS = 50

WORKSPACE_DOTENV = TERA_ROOT.parent / ".env"
TERA_DOTENV = TERA_ROOT / ".env"

def load_env(path):
    if not os.path.exists(path): return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

load_env(WORKSPACE_DOTENV)
load_env(TERA_DOTENV)

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
MISTRAL_KEY = os.environ.get("MISTRAL_API_KEY")
TALOCODE_KEY = os.environ.get("TALOCODE_API_KEY")
BASE_URL = os.environ.get("TALOCODE_BASE_URL", "https://api.talocode.site")
RESEND_KEY = os.environ.get("RESEND_API_KEY")
RESEND_FROM = os.environ.get("RESEND_FROM", "onboarding@resend.dev")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")

if not BOT_TOKEN: raise SystemExit("TELEGRAM_BOT_TOKEN not set")
if not MISTRAL_KEY and not TALOCODE_KEY: raise SystemExit("No API key — set MISTRAL_API_KEY or TALOCODE_API_KEY")

TG = f"https://api.telegram.org/bot{BOT_TOKEN}"
MISTRAL = "https://api.mistral.ai/v1/chat/completions"

def tg(method, data=None):
    if data and "text" in data and method == "sendMessage":
        data = {**data, "text": clean_md(data["text"])}
    return (requests.post if data else requests.get)(f"{TG}/{method}", json=data).json()

def llm(messages, max_tokens=800, user_id=None):
    key = get_effective_key(user_id) if user_id else TALOCODE_KEY
    if key:
        r = requests.post(f"{BASE_URL}/v1/tera/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"messages": messages, "max_tokens": max_tokens})
    else:
        r = requests.post(MISTRAL,
            headers={"Authorization": f"Bearer {MISTRAL_KEY}", "Content-Type": "application/json"},
            json={"model": "mistral-small-latest", "messages": messages, "max_tokens": max_tokens})
    return r.json()["choices"][0]["message"]["content"]

# ---------------------------------------------------------------------------
# Minimal PDF generator (no external dependencies)
# ---------------------------------------------------------------------------
def make_pdf(title, body):
    esc = lambda t: t.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\n", ")\\Tj\nTd (")
    lines = body.split("\n")
    y = 720
    stream_parts = [f"BT /F1 14 Tf 50 750 Td ({esc(title[:80])}) Tj ET"]
    for line in lines:
        if y < 50: break
        stream_parts.append(f"BT /F1 10 Tf 50 {y} Td ({esc(line[:100])}) Tj ET")
        y -= 14
    stream = "\n".join(stream_parts)
    stream_len = len(stream.encode("latin-1", errors="replace"))
    pdf = f"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length {stream_len}>>stream
{stream}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Courier>>endobj
xref
0 6
0000000000 65535 f \r
"""
    offset = len(pdf.encode("latin-1"))
    pdf += f"0000000009 00000 n \r\n0000000058 00000 n \r\n0000000115 00000 n \r\n0000000266 00000 n \r\n0000000{378 + stream_len} 00000 n \r\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n{offset}\n%%EOF"
    return pdf.encode("latin-1", errors="replace")

# ---------------------------------------------------------------------------
# JSON data helpers
# ---------------------------------------------------------------------------
def read_json(path, default=None):
    if not path.exists(): return {} if default is None else default
    return json.loads(path.read_text())

def write_json(path, data):
    path.write_text(json.dumps(data, indent=2))

def get_memory(user_id):
    data = read_json(MEMORY_FILE, default={})
    return data.get(str(user_id), {})

def set_memory(user_id, key, value):
    data = read_json(MEMORY_FILE, default={})
    uid = str(user_id)
    if uid not in data: data[uid] = {}
    data[uid][key] = value
    write_json(MEMORY_FILE, data)

def list_memory(user_id):
    return get_memory(user_id)

def add_event(user_id, date_str, title):
    data = read_json(CALENDAR_FILE, default=[])
    data.append({"user": str(user_id), "date": date_str, "title": title, "id": str(time.time())})
    write_json(CALENDAR_FILE, data)

def list_events(user_id):
    return [e for e in read_json(CALENDAR_FILE, default=[]) if e["user"] == str(user_id)]

# ---------------------------------------------------------------------------
# Credit system
# ---------------------------------------------------------------------------
CUSTOM_CREDITS = {
    "pdf": 5,
    "voice": 3,
    "email": 2,
}

def get_credits(user_id):
    data = read_json(CREDITS_FILE, default={})
    uid = str(user_id)
    if uid not in data:
        data[uid] = DEFAULT_FREE_CREDITS
        write_json(CREDITS_FILE, data)
    return data[uid]

def charge_credit(user_id, amount=1):
    data = read_json(CREDITS_FILE, default={})
    uid = str(user_id)
    bal = data.get(uid, DEFAULT_FREE_CREDITS)
    if bal < amount: return False
    data[uid] = bal - amount
    write_json(CREDITS_FILE, data)
    return True

def add_credits(user_id, amount):
    data = read_json(CREDITS_FILE, default={})
    uid = str(user_id)
    data[uid] = data.get(uid, DEFAULT_FREE_CREDITS) + amount
    write_json(CREDITS_FILE, data)

# ---------------------------------------------------------------------------
# Per-user auth
# ---------------------------------------------------------------------------
def get_user_key(user_id):
    data = read_json(KEY_FILE, default={})
    return data.get(str(user_id))

def set_user_key(user_id, key):
    data = read_json(KEY_FILE, default={})
    data[str(user_id)] = key
    write_json(KEY_FILE, data)

def remove_user_key(user_id):
    data = read_json(KEY_FILE, default={})
    data.pop(str(user_id), None)
    write_json(KEY_FILE, data)

def get_effective_key(user_id):
    return get_user_key(user_id) or TALOCODE_KEY

def has_access(user_id):
    return bool(get_effective_key(user_id))

def validate_talo_key(key):
    try:
        r = requests.get(f"{BASE_URL}/v1/tera/health",
            headers={"Authorization": f"Bearer {key}"}, timeout=10)
        return r.status_code == 200
    except Exception:
        return False

def clean_md(text):
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^[-*]{3,}\s*$', '---', text, flags=re.MULTILINE)
    return text.strip()

def send(chat_id, text, **kw):
    tg("sendMessage", {"chat_id": chat_id, "text": text, "parse_mode": "Markdown", **kw})

def talo(path, body=None, method="POST", user_id=None):
    key = get_effective_key(user_id) if user_id else TALOCODE_KEY
    if not key: return None
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    fn = requests.post if method == "POST" else requests.get
    r = fn(f"{BASE_URL}{path}", headers=headers, json=body)
    return r.json()

# ---------------------------------------------------------------------------
# Capability registry
# ---------------------------------------------------------------------------
CAPABILITIES = {
    "chat": {
        "name": "Chat",
        "desc": "General conversation, Q&A, brainstorming, reasoning",
        "triggers": ["chat", "talk", "ask", "question", "think", "explain", "what", "why", "how", "tell me"],
    },
    "coding": {
        "name": "Code",
        "desc": "Write, explain, review, and debug code across all languages",
        "triggers": ["code", "write code", "program", "script", "function", "debug", "implement", "build a"],
    },
    "writing": {
        "name": "Write",
        "desc": "Draft articles, rewrite text, compose emails, reports, and docs",
        "triggers": ["write", "draft", "rewrite", "compose", "article", "blog", "essay"],
    },
    "search": {
        "name": "SearchLane",
        "desc": "Web search, news, and deep research",
        "triggers": ["search", "find", "look up", "research", "google", "news about"],
        "api": {"path": "/v1/searchlane/query", "keyed": True, "credit": 5},
    },
    "browse": {
        "name": "Agent Browser",
        "desc": "Browse websites, take screenshots, extract content, analyze pages",
        "triggers": ["browse", "visit", "screenshot", "check website", "extract from", "analyze page", "take screenshot", "preview"],
        "api": {"path": "/v1/agent-browser/check", "keyed": True, "credit": 5},
    },
    "skills": {
        "name": "Skills",
        "desc": "Generate AI skill packs from GitHub profiles, repos, docs, or text",
        "triggers": ["skill", "skill pack", "cursor skill", "claude skill", "github profile skill"],
        "api": {"path": "/v1/skills/generate/text", "keyed": True, "credit": 40},
    },
    "invoices": {
        "name": "InvoiceLane",
        "desc": "Extract data from invoices and receipts, validate billing fields",
        "triggers": ["invoice", "receipt", "extract invoice", "billing"],
        "api": {"path": "/v1/invoicelane/extract", "keyed": True, "credit": 20},
    },
    "geolane": {
        "name": "GeoLane",
        "desc": "GEO audit, domain analysis, citation readiness, AI crawler checks",
        "triggers": ["geo", "geolane", "domain audit", "seo audit", "citation"],
        "api": {"path": "/v1/geolane/audit", "keyed": True, "credit": 40},
    },
    "verify": {
        "name": "VerifyLane",
        "desc": "Check code for secrets, security issues, quality markers",
        "triggers": ["verify", "security check", "scan secrets", "code quality"],
        "api": {"path": "/v1/verifylane/secrets", "keyed": True, "credit": 3},
    },
    "tradia": {
        "name": "Tradia",
        "desc": "Trading plans, market analysis, signal evaluation, risk checks",
        "triggers": ["trade", "trading", "market", "stock", "signal", "portfolio", "backtest"],
        "api": {"path": "/v1/tradia/agent/plan", "keyed": True, "credit": 40},
    },
    "cliploop": {
        "name": "ClipLoop",
        "desc": "Generate video briefs, scripts, and render short-form videos",
        "triggers": ["video", "clip", "short", "reel", "tiktok", "youtube short"],
        "api": {"path": "/v1/cliploop/brief/generate", "keyed": True, "credit": 15},
    },
    "content": {
        "name": "UGC Lane",
        "desc": "Content strategy, competitor analysis, hooks, scripts, calendars",
        "triggers": ["content", "ugc", "strategy", "hooks", "content calendar"],
        "api": {"path": "/v1/ugclane/strategy/generate", "keyed": True, "credit": 30},
    },
    "signals": {
        "name": "SignalLane",
        "desc": "X/Twitter account analysis, content plans, post drafts",
        "triggers": ["x analysis", "twitter", "signal x", "x content"],
        "api": {"path": "/v1/signallane/x/analyze", "keyed": True, "credit": 30},
    },
    "forgecad": {
        "name": "ForgeCAD",
        "desc": "Parametric CAD design, OpenSCAD, 3D printability, BOM generation",
        "triggers": ["cad", "design", "3d print", "openscad", "stl", "bom"],
        "api": {"path": "/v1/forgecad/design/generate", "keyed": True, "credit": 60},
    },
    "opensource": {
        "name": "OpenSourceLane",
        "desc": "Analyze repos, find alternatives, migration plans, license audits",
        "triggers": ["opensource", "repo analyze", "migration", "license audit"],
        "api": {"path": "/v1/opensourcelane/repo/analyze", "keyed": True, "credit": 25},
    },
    "crawlerlane": {
        "name": "CrawlerLane",
        "desc": "AI visibility scoring, sitemap suggestions, bot classification",
        "triggers": ["crawler", "ai visibility", "sitemap", "robots.txt", "bot audit"],
        "api": {"path": "/v1/crawlerlane/ai-visibility/score", "keyed": True, "credit": 30},
    },
    "webdata": {
        "name": "WebDataLane",
        "desc": "Fetch web pages, extract content, convert to markdown, metadata",
        "triggers": ["webdata", "fetch page", "extract content", "extract", "scrape", "markdown", "content from", "contents from", "get contents", "convert to markdown"],
        "api": {"path": "/v1/webdatalane/fetch", "keyed": True, "credit": 5},
    },
    "replylane": {
        "name": "ReplyLane",
        "desc": "Score reply opportunities, draft replies, spam risk checks",
        "triggers": ["reply", "engagement", "reply draft", "social reply"],
        "api": {"path": "/v1/replylane/opportunity/score", "keyed": True, "credit": 15},
    },
    "evallane": {
        "name": "EvalLane",
        "desc": "Run evaluation suites, score LLM outputs, test cases",
        "triggers": ["eval", "evaluate", "test llm", "score output"],
        "api": {"path": "/v1/evallane/suite", "keyed": True, "credit": 5},
    },
    "policylane": {
        "name": "PolicyLane",
        "desc": "Check actions against policy, redact secrets from text",
        "triggers": ["policy", "allow", "deny", "check action", "redact"],
        "api": {"path": "/v1/policylane/check", "keyed": True, "credit": 2},
    },
    "email": {
        "name": "Email",
        "desc": "Send emails via Resend API — provide recipient, subject, and body",
        "triggers": ["email", "send email", "mail", "send mail", "send to"],
    },
    "pdf": {
        "name": "PDF Gen",
        "desc": "Generate a PDF document from text — provide the content you want in the PDF",
        "triggers": ["pdf", "generate pdf", "create pdf", "make pdf", "document pdf"],
    },
    "weather": {
        "name": "Weather/Time",
        "desc": "Get current weather for a city or the current date/time",
        "triggers": ["weather", "temperature", "forecast", "what time", "current time", "date today", "time in"],
    },
    "calendar": {
        "name": "Calendar",
        "desc": "Manage events — add, list, or delete calendar events",
        "triggers": ["calendar", "event", "schedule", "remind me", "appointment"],
    },
    "memory": {
        "name": "Memory",
        "desc": "Remember facts about you — store and recall information across conversations",
        "triggers": ["remember", "remember that", "do you remember", "my name is", "i like", "store", "recall", "what do you know"],
    },
    "voice": {
        "name": "Voice",
        "desc": "Convert text to speech and send as a voice message",
        "triggers": ["voice", "say", "speak", "read aloud", "text to speech", "tts", "audio"],
    },
}

SYSTEM = {
    "role": "system",
    "content": (
        "You are TeraAI — an AI assistant built on Talocode infrastructure.\n\n"
        "When the user asks for live actions (browse, search, extract, code, write, trade, etc.), "
        "the system will detect this and route to the appropriate API automatically. You just chat.\n\n"
        "Rules:\n"
        "1. Answer questions conversationally from your knowledge.\n"
        "2. If the user asks you to DO something you cannot do yourself, say: \"That capability is available with a TALOCODE_API_KEY from dashboard.talocode.site. In the meantime, here's what I know...\" and answer from knowledge.\n"
        "3. Be concise, helpful, and direct.\n"
        "4. Do NOT use Markdown headings (# ## ### etc) — Telegram doesn't support them. Use **bold** for emphasis instead."
    )
}

CAP_KEYS = [k for k in CAPABILITIES if k != "chat"]
CAP_DESCS = "\n".join(f"- \"{k}\": {CAPABILITIES[k]['name']} — {CAPABILITIES[k]['desc']}" for k in CAP_KEYS)

ROUTER_PROMPT = lambda text: (
    "You are a classifier. Given a user message, pick the single best capability from the list below to handle it. "
    "If none fit, answer \"chat\". Reply with ONLY a single word — the capability key.\n\n"
    f"Available capabilities:\n{CAP_DESCS}\n\nUser message: {text}"
)

def route_intent(text):
    text_lower = text.lower().strip()
    for key, cap in CAPABILITIES.items():
        for t in cap.get("triggers", []):
            if t in text_lower:
                return key
    try:
        reply = llm([{"role": "user", "content": ROUTER_PROMPT(text)}], max_tokens=20)
        reply = reply.strip().lower().rstrip(".")
        if reply in CAPABILITIES:
            return reply
    except Exception:
        pass
    return "chat"

def call_capability(key, user_text, user_id=None):
    cap = CAPABILITIES[key]
    if "api" not in cap:
        return None
    api = cap["api"]
    path = api["path"]
    body = {"query": user_text} if key == "search" else {"url": user_text} if key in ("browse",) else {"text": user_text} if key in ("verify", "invoices") else {"brief": user_text} if key in ("writing", "cliploop", "content") else {"code": user_text} if key in ("coding",) else {"username": user_text} if key == "skills" else {"repo_url": user_text} if key == "opensource" else {"task": user_text} if key == "forgecad" else {"query": user_text} if key == "webdata" else {"text": user_text}
    result = talo(path, body, user_id=user_id)
    return result

def handle_capability(chat_id, key, user_text):
    cap = CAPABILITIES[key]
    tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})

    if not get_effective_key(chat_id) and "api" in cap:
        msg = (
            f"⚠️ *{cap['name']}* — `{cap['api']['credit']}cr` per request\n\n"
            f"{cap['desc']}\n\n"
            f"To use this, authenticate with your **TALOCODE_API_KEY**:\n"
            f"1. Get a key at [dashboard.talocode.site](https://dashboard.talocode.site)\n"
            f"2. Send `/login <your_key>` to this bot\n\n"
            f"Want me to answer this in chat mode instead?"
        )
        tg("sendMessage", {"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
        return True

    if key == "email":
        if not RESEND_KEY:
            tg("sendMessage", {"chat_id": chat_id, "text": "⚠️ RESEND_API_KEY not configured. Add it to `.env` to send emails.", "parse_mode": "Markdown"})
            return True
        cost = CUSTOM_CREDITS.get("email", 2)
        bal = get_credits(chat_id)
        if bal < cost:
            tg("sendMessage", {"chat_id": chat_id, "text": f"⚠️ Sending email costs **{cost}cr**. You have **{bal}cr**. Contact admin to top up.", "parse_mode": "Markdown"})
            return True
        tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
        try:
            parsed = llm([{"role": "system", "content": "Extract email details from the user's request. Reply with ONLY JSON: {\"to\": \"...\", \"subject\": \"...\", \"body\": \"...\"}. If no recipient given, use abdulmuizproject@gmail.com as default."}, {"role": "user", "content": user_text}], max_tokens=300, user_id=chat_id)
            parsed = parsed.strip()
            if parsed.startswith("```"): parsed = parsed.split("\n", 1)[1].rsplit("\n", 1)[0]
            details = json.loads(parsed)
            to_addr = details.get("to", "").strip() or "abdulmuizproject@gmail.com"
            if "@" not in to_addr:
                tg("sendMessage", {"chat_id": chat_id, "text": "I need a valid recipient email. Try: *send email to abdulmuizproject@gmail.com about the project update*", "parse_mode": "Markdown"})
                return True
            r = requests.post("https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"},
                json={"from": RESEND_FROM, "to": [to_addr], "subject": details.get("subject", "No subject"), "text": details.get("body", "")})
            result = r.json()
            if r.status_code == 200:
                charge_credit(chat_id, cost)
                tg("sendMessage", {"chat_id": chat_id, "text": f"✅ Email sent to **{to_addr}**\nSubject: {details.get('subject', 'No subject')}\nID: `{result.get('id', '')}`\nRemaining: {get_credits(chat_id)}cr", "parse_mode": "Markdown"})
            else:
                note = " (Resend test tier only sends to abdulmuizproject@gmail.com — verify a domain at resend.com/domains to send to others)" if "only send testing emails" in str(result) else ""
                tg("sendMessage", {"chat_id": chat_id, "text": f"❌ {result.get('message', json.dumps(result))}{note}", "parse_mode": "Markdown"})
        except Exception as e:
            tg("sendMessage", {"chat_id": chat_id, "text": f"Error sending email: {e}"})
        return True

    if key == "pdf":
        cost = CUSTOM_CREDITS.get("pdf", 5)
        bal = get_credits(chat_id)
        if bal < cost:
            tg("sendMessage", {"chat_id": chat_id, "text": f"⚠️ PDF generation costs **{cost}cr**. You have **{bal}cr**. Contact admin to top up.", "parse_mode": "Markdown"})
            return True
        tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
        try:
            lines_in = user_text.split("\n", 1)
            title = lines_in[0][:100] if len(lines_in) > 1 else "Document"
            body = lines_in[1] if len(lines_in) > 1 else user_text
            pdf_data = make_pdf(title, body)
            charge_credit(chat_id, cost)
            files = {"document": ("document.pdf", pdf_data, "application/pdf")}
            r = requests.post(f"{TG}/sendDocument", data={"chat_id": chat_id, "caption": f"Remaining: {get_credits(chat_id)}cr"}, files=files)
            if not r.json().get("ok"):
                add_credits(chat_id, cost)
                tg("sendMessage", {"chat_id": chat_id, "text": "❌ PDF send failed — credits refunded: " + str(r.json().get("description", "")), "parse_mode": "Markdown"})
        except Exception as e:
            tg("sendMessage", {"chat_id": chat_id, "text": f"Error generating PDF: {e}"})
        return True

    if key == "weather":
        tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
        try:
            now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            words = user_text.lower().split()
            city = None
            for i, w in enumerate(words):
                if w in ("in", "for", "at") and i + 1 < len(words):
                    city = " ".join(words[i+1:i+3]).strip(" ?.!")
                    break
            if city:
                r = requests.get(f"https://wttr.in/{city}?format=%C+%t+%h+%w", timeout=10)
                weather = r.text.strip() if r.status_code == 200 else "unavailable"
                tg("sendMessage", {"chat_id": chat_id, "text": f"📍 *{city.title()}*\n🌤 {weather}\n🕐 {now}", "parse_mode": "Markdown"})
            else:
                tg("sendMessage", {"chat_id": chat_id, "text": f"🕐 Current time: `{now}`\n\n_Say \"weather in London\" to get weather for a city._", "parse_mode": "Markdown"})
        except Exception as e:
            tg("sendMessage", {"chat_id": chat_id, "text": f"Error: {e}"})
        return True

    if key == "calendar":
        tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
        try:
            parsed = llm([{"role": "system", "content": "Extract calendar action. Reply with ONLY JSON: {\"action\": \"add\"|\"list\"|\"delete\", \"date\": \"...\", \"title\": \"...\"}. If showing events, action=list. If adding, action=add with date and title."}, {"role": "user", "content": user_text}], max_tokens=200, user_id=chat_id)
            parsed = parsed.strip()
            if parsed.startswith("```"): parsed = parsed.split("\n", 1)[1].rsplit("\n", 1)[0]
            cmd = json.loads(parsed)
            uid = str(chat_id)
            if cmd.get("action") == "add" and cmd.get("title"):
                add_event(uid, cmd.get("date", "today"), cmd["title"])
                tg("sendMessage", {"chat_id": chat_id, "text": f"✅ Event added: **{cmd['title']}** on {cmd.get('date', 'today')}", "parse_mode": "Markdown"})
            else:
                events = list_events(uid)
                if events:
                    lines = ["*Your Events:*"]
                    for e in events[-10:]:
                        lines.append(f"• {e['date']} — {e['title']}")
                    tg("sendMessage", {"chat_id": chat_id, "text": "\n".join(lines), "parse_mode": "Markdown"})
                else:
                    tg("sendMessage", {"chat_id": chat_id, "text": "No events saved. Say *remember meeting on Friday* to add one.", "parse_mode": "Markdown"})
        except Exception as e:
            tg("sendMessage", {"chat_id": chat_id, "text": f"Calendar error: {e}"})
        return True

    if key == "memory":
        tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
        try:
            parsed = llm([{"role": "system", "content": "Extract memory action. Reply with ONLY JSON: {\"action\": \"store\"|\"recall\", \"key\": \"...\", \"value\": \"...\"}. If remembering something, action=store with key and value. If asking what I know, action=recall."}, {"role": "user", "content": user_text}], max_tokens=200, user_id=chat_id)
            parsed = parsed.strip()
            if parsed.startswith("```"): parsed = parsed.split("\n", 1)[1].rsplit("\n", 1)[0]
            cmd = json.loads(parsed)
            uid = str(chat_id)
            if cmd.get("action") == "store" and cmd.get("key"):
                set_memory(uid, cmd["key"], cmd.get("value", ""))
                tg("sendMessage", {"chat_id": chat_id, "text": f"🧠 Got it! I'll remember: **{cmd['key']}**: {cmd.get('value', '')}", "parse_mode": "Markdown"})
            else:
                facts = list_memory(uid)
                if facts:
                    lines = ["*What I know about you:*"]
                    for k, v in facts.items():
                        lines.append(f"• **{k}**: {v}")
                    tg("sendMessage", {"chat_id": chat_id, "text": "\n".join(lines), "parse_mode": "Markdown"})
                else:
                    tg("sendMessage", {"chat_id": chat_id, "text": "I don't know anything about you yet. Say *remember my name is Abdulmuiz* to teach me!", "parse_mode": "Markdown"})
        except Exception as e:
            tg("sendMessage", {"chat_id": chat_id, "text": f"Memory error: {e}"})
        return True

    if key == "voice":
        cost = CUSTOM_CREDITS.get("voice", 3)
        bal = get_credits(chat_id)
        if bal < cost:
            tg("sendMessage", {"chat_id": chat_id, "text": f"⚠️ Voice generation costs **{cost}cr**. You have **{bal}cr**. Contact admin to top up.", "parse_mode": "Markdown"})
            return True
        tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
        try:
            from gtts import gTTS
            text_to_say = user_text
            parts = user_text.split(" ", 1)
            if len(parts) > 1 and parts[0].lower() in ("say", "speak", "voice"):
                text_to_say = parts[1]
            buf = io.BytesIO()
            tts = gTTS(text=text_to_say[:500], lang="en", slow=False)
            tts.write_to_fp(buf)
            buf.seek(0)
            files = {"voice": ("voice.ogg", buf.getvalue(), "audio/ogg")}
            r = requests.post(f"{TG}/sendVoice", data={"chat_id": chat_id}, files=files)
            if not r.json().get("ok"):
                files2 = {"audio": ("voice.mp3", buf.getvalue(), "audio/mpeg")}
                r2 = requests.post(f"{TG}/sendAudio", data={"chat_id": chat_id}, files=files2)
                if r2.json().get("ok"):
                    charge_credit(chat_id, cost)
                    tg("sendMessage", {"chat_id": chat_id, "text": f"Remaining: {get_credits(chat_id)}cr", "parse_mode": "Markdown"})
                else:
                    tg("sendMessage", {"chat_id": chat_id, "text": "❌ Voice send failed"})
        except Exception as e:
            tg("sendMessage", {"chat_id": chat_id, "text": f"Voice error: {e}"})
        return True

    if "api" in cap:
        if not has_access(chat_id):
            tg("sendMessage", {"chat_id": chat_id, "text": "🔑 This requires a TALOCODE_API_KEY. Send `/login <your_key>` to authenticate, or get one at dashboard.talocode.site.", "parse_mode": "Markdown"})
            return True
        try:
            result = call_capability(key, user_text, user_id=chat_id)
            if result:
                summary = json.dumps(result, indent=2)[:3000]
                tg("sendMessage", {"chat_id": chat_id, "text": f"*{cap['name']}* result:\n```\n{summary}\n```", "parse_mode": "Markdown"})
            else:
                tg("sendMessage", {"chat_id": chat_id, "text": f"_{cap['name']} returned no result._", "parse_mode": "Markdown"})
        except Exception as e:
            tg("sendMessage", {"chat_id": chat_id, "text": f"Error calling {cap['name']}: {e}"})
        return True
    return False

def show_capabilities(chat_id):
    keys = [" 🔑 (needs key)", " ✅ (key active)"]
    has_api = has_access(chat_id)
    lines = [f"*TeraAI — All Capabilities*  |  `{get_credits(chat_id)}cr`  {keys[has_api]}\n"]
    for key, cap in CAPABILITIES.items():
        credit = f" ({cap['api']['credit']}cr)" if "api" in cap else ""
        custom = f" ({CUSTOM_CREDITS.get(key, 0)}cr)" if key in CUSTOM_CREDITS else ""
        ok = has_api and "api" in cap
        status = " ✅" if ok else " 🔑" if "api" in cap else ""
        lines.append(f"• **{cap['name']}**{credit}{custom} — {cap['desc']}{status}")
    lines.append(f"\nJust describe what you need in natural language!")
    tg("sendMessage", {"chat_id": chat_id, "text": "\n".join(lines), "parse_mode": "Markdown"})

def handle_help(chat_id):
    tg("sendMessage", {
        "chat_id": chat_id,
        "text": (
            "*TeraAI — Infrastructure Agent*\n\n"
            "/start — Intro\n"
            "/caps — Show all capabilities\n"
            "/balance — Check your credit balance\n"
            "/login `<key>` — Authenticate with your TALOCODE_API_KEY\n"
            "/logout — Remove your API key\n"
            "/help — This help\n\n"
            "Just describe what you need — I'll route to the right capability.\n"
            "Examples:\n"
            "• \"search for latest AI news\"\n"
            "• \"write a python script to sort files\"\n"
            "• \"browse https://example.com\"\n"
            "• \"analyze my trading portfolio\"\n"
            "• \"generate a video brief for a product launch\"\n"
            "• \"scan this code for secrets\"\n\n"
            f"TALOCODE_API_KEY: {'set' if TALOCODE_KEY else 'missing — get one at dashboard.talocode.site'}"
        ),
        "parse_mode": "Markdown",
    })

def main():
    offset = 0
    print("TeraAI Infrastructure Agent running...")
    if TALOCODE_KEY: print("TALOCODE_API_KEY: connected")
    else: print("TALOCODE_API_KEY: missing — API capabilities disabled")

    while True:
        result = tg("getUpdates", {"offset": offset, "timeout": 30})
        if not result.get("ok"):
            print("getUpdates error:", result)
            time.sleep(5)
            continue

        for update in result.get("result", []):
            offset = update["update_id"] + 1
            msg = update.get("message") or update.get("channel_post")
            if not msg: continue

            chat_id = msg["chat"]["id"]
            text = msg.get("text", "")
            user = msg["from"].get("first_name", "User") if msg.get("from") else "Anonymous"
            print(f"{user}: {text}")

            if text == "/start":
                tg("sendMessage", {"chat_id": chat_id,
                    "text": f"Hello {user}! I'm *TeraAI* — the Talocode AI infrastructure agent. I can help with coding, writing, search, browsing, trading, content, and more. Try /caps to see everything I can do.",
                    "parse_mode": "Markdown"})
                continue

            if text == "/balance":
                tg("sendMessage", {"chat_id": chat_id, "text": f"💰 Your balance: **{get_credits(chat_id)}cr**\n\nPDF: 5cr | Voice: 3cr | Email: 2cr\n\n_Admin can top up with /topup._", "parse_mode": "Markdown"})
                continue

            is_admin = ADMIN_CHAT_ID and str(chat_id) == ADMIN_CHAT_ID

            if text.startswith("/topup") and is_admin:
                parts = text.split()
                if len(parts) == 2 and parts[1].isdigit():
                    add_credits(chat_id, int(parts[1]))
                    tg("sendMessage", {"chat_id": chat_id, "text": f"💰 Topped up **{parts[1]}cr**\nNew balance: **{get_credits(chat_id)}cr**", "parse_mode": "Markdown"})
                else:
                    tg("sendMessage", {"chat_id": chat_id, "text": "Usage: `/topup <amount>`", "parse_mode": "Markdown"})
                continue

            if text.startswith("/grant") and is_admin:
                parts = text.split()
                if len(parts) == 3 and parts[2].isdigit():
                    add_credits(parts[1], int(parts[2]))
                    tg("sendMessage", {"chat_id": chat_id, "text": f"✅ Granted **{parts[2]}cr** to user `{parts[1]}`", "parse_mode": "Markdown"})
                else:
                    tg("sendMessage", {"chat_id": chat_id, "text": "Usage: `/grant <chat_id> <amount>`", "parse_mode": "Markdown"})
                continue

            if text.startswith("/login"):
                parts = text.split()
                if len(parts) == 2:
                    key = parts[1]
                    tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})
                    if validate_talo_key(key):
                        set_user_key(chat_id, key)
                        tg("sendMessage", {"chat_id": chat_id, "text": "✅ Authenticated! Your TALOCODE_API_KEY is now active. Try /caps to see available capabilities.", "parse_mode": "Markdown"})
                    else:
                        tg("sendMessage", {"chat_id": chat_id, "text": "❌ Invalid API key. Get one at dashboard.talocode.site", "parse_mode": "Markdown"})
                else:
                    tg("sendMessage", {"chat_id": chat_id, "text": "Usage: `/login <your_talocode_api_key>`\nGet one at dashboard.talocode.site", "parse_mode": "Markdown"})
                continue

            if text == "/logout":
                if get_user_key(chat_id):
                    remove_user_key(chat_id)
                    tg("sendMessage", {"chat_id": chat_id, "text": "🔓 Logged out. Your API key has been removed.", "parse_mode": "Markdown"})
                else:
                    tg("sendMessage", {"chat_id": chat_id, "text": "You're not logged in.", "parse_mode": "Markdown"})
                continue

            if text in ("/caps", "/capabilities"):
                show_capabilities(chat_id)
                continue

            if text == "/help":
                handle_help(chat_id)
                continue

            tg("sendChatAction", {"chat_id": chat_id, "action": "typing"})

            intent = route_intent(text)
            print(f"  -> intent: {intent}")

            if intent != "chat" and handle_capability(chat_id, intent, text):
                continue

            try:
                reply = llm([SYSTEM, {"role": "user", "content": text}], user_id=chat_id)
                tg("sendMessage", {"chat_id": chat_id, "text": reply, "parse_mode": "Markdown"})
                print(f"  -> reply: {reply[:150]}...")
            except Exception as e:
                err = f"Error: {e}"
                tg("sendMessage", {"chat_id": chat_id, "text": err})
                print("LLM error:", err)

        time.sleep(0.5)

if __name__ == "__main__":
    main()
