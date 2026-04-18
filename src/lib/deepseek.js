const RESPONSE_CACHE = {
  'bijli 3800 split 5': {
    amount_rupees: 3800,
    description: 'Electricity bill',
    split_count: 5,
    share_rupees: 760,
    category: 'utilities',
  },
  'bijli ka bill 3800 5 logon mein': {
    amount_rupees: 3800,
    description: 'Electricity bill',
    split_count: 5,
    share_rupees: 760,
    category: 'utilities',
  },
  'grocery 2400 split 4': {
    amount_rupees: 2400,
    description: 'Groceries',
    split_count: 4,
    share_rupees: 600,
    category: 'groceries',
  },
  'pizza 1800 4 bande': {
    amount_rupees: 1800,
    description: 'Pizza delivery',
    split_count: 4,
    share_rupees: 450,
    category: 'food',
  },
  'internet 1200 split 5': {
    amount_rupees: 1200,
    description: 'Internet bill',
    split_count: 5,
    share_rupees: 240,
    category: 'utilities',
  },
  'uber 650 3 log': {
    amount_rupees: 650,
    description: 'Uber ride',
    split_count: 3,
    share_rupees: 217,
    category: 'transport',
  },
  'gas bill 800 split 5': {
    amount_rupees: 800,
    description: 'Gas bill',
    split_count: 5,
    share_rupees: 160,
    category: 'utilities',
  },
}

const SYSTEM_PROMPT = `You are an expense parser for a Pakistani group expense app.
Users type expenses in Roman Urdu, English, or mixed language.
Parse the input and return ONLY a JSON object. No markdown. No explanation. Just JSON.

Required JSON fields:
{
  "amount_rupees": number,
  "description": "short English description",
  "split_count": number,
  "share_rupees": number,
  "category": "utilities|food|transport|groceries|entertainment|other"
}

Rules:
- share_rupees = Math.round(amount_rupees / split_count)
- If split count unclear, default to 2
- If amount unclear, return {"error": "amount not found"}
- Always return valid JSON only

Examples:
"bijli 3800 split 5" → {"amount_rupees":3800,"description":"Electricity bill","split_count":5,"share_rupees":760,"category":"utilities"}
"Ahmed ne grocery li 1200 hum 4 hain" → {"amount_rupees":1200,"description":"Groceries","split_count":4,"share_rupees":300,"category":"groceries"}
`

function normalizeKey(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseJsonFromContent(content) {
  if (!content) return null
  const trimmed = content.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(trimmed.slice(start, end + 1))
  } catch {
    return null
  }
}

async function callDeepSeek(userText) {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY
  if (!apiKey) return null

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText },
      ],
      temperature: 0.2,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return parseJsonFromContent(content)
}

async function callGeminiFallback(userText) {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return null

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nInput:\n${userText}` }] }],
      generationConfig: { temperature: 0.2 },
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  return parseJsonFromContent(text)
}

/**
 * Parse Roman Urdu / mixed expense text. AI used only here.
 * @returns {Promise<object|null>} parsed fields or null if manual fallback needed
 */
export async function parseExpenseText(rawInput) {
  const key = normalizeKey(rawInput)
  if (RESPONSE_CACHE[key]) {
    return { ...RESPONSE_CACHE[key], _source: 'cache' }
  }

  let parsed = await callDeepSeek(rawInput)
  if (parsed?.error) return parsed
  if (parsed && typeof parsed.amount_rupees === 'number') {
    return { ...parsed, _source: 'deepseek' }
  }

  parsed = await callGeminiFallback(rawInput)
  if (parsed?.error) return parsed
  if (parsed && typeof parsed.amount_rupees === 'number') {
    return { ...parsed, _source: 'gemini' }
  }

  return null
}

export { RESPONSE_CACHE }
