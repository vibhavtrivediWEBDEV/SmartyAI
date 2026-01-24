// pages/api/ncert/fetchNCERTQuestion.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import OpenAI from 'openai'

// pure-JS PDF parser
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse') as (data: Buffer) => Promise<{ text: string }>

// OpenAI client (used for math normalization)
const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY || '' })

// cache so we only parse once per server run
let _fullText: string | null = null
async function getFullText() {
  if (!_fullText) {
    const buf = fs.readFileSync(
      path.join(process.cwd(), 'data', 'ncert-mh-ch-2.pdf')
    )
    _fullText = (await pdfParse(buf)).text
  }

  return _fullText
}

export async function POST(request: NextRequest) {
  try {
    const { questionNumber } = await request.json()
    if (!questionNumber) {
      return NextResponse.json(
        { error: 'Missing questionNumber' },
        { status: 400 }
      )
    }

    const text = await getFullText()

    // Extract the raw question & solution blocks
    const qRe = new RegExp(
      `Question\\s*${questionNumber}\\s*[:\\)]?[\\s\\S]*?(?=(Solution\\s*${questionNumber}|Question\\s*${+questionNumber + 1}|Exercise))`,
      'i'
    )
    const aRe = new RegExp(
      `Solution\\s*${questionNumber}\\s*[:\\-]?[\\s\\S]*?(?=(Question\\s*${+questionNumber + 1}|$))`,
      'i'
    )

    const rawQ = text.match(qRe)?.[0]?.trim() || ''
    const rawA = text.match(aRe)?.[0]?.trim() || ''

    if (!rawQ) {
      return NextResponse.json({
        questionText: 'Question not found in NCERT textbook.',
        answerText: '',
      })
    }

    // Clean private‐use glyphs & whitespace
    const clean = (s: string) =>
      s
        .normalize('NFKC')
        .replace(/[\uF000-\uF8FF]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

    const questionSnippet = clean(rawQ)
    const answerSnippet = clean(rawA)

    // If we have an API key, call GPT to rebuild perfect math notation
    if (process.env.OPEN_API_KEY) {
      try {
        const systemMessage = {
          role: 'system',
          content: `
You are an expert formatter for NCERT questions.
Given raw snippets that may have lost superscripts or formatting,
reconstruct the exact textbook lines, using plain-text parentheses and Unicode superscripts (e.g. ⁻¹),
and output ONLY a JSON object with two keys:
  "questionText" and "answerText".
Do NOT include any extra commentary or markdown, just the raw JSON.
          `.trim(),
        }
        const userMessage = {
          role: 'user',
          content: `
Question snippet:
\`\`\`
${questionSnippet}
\`\`\`

Solution snippet:
\`\`\`
${answerSnippet}
\`\`\`
          `.trim(),
        }

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [systemMessage, userMessage],
          temperature: 0,
          max_tokens: 200,
        })

        const raw = completion.choices[0].message.content.trim()
        const parsed = JSON.parse(raw)
        return NextResponse.json(parsed)
      } catch (e) {
        console.warn('Math-normalizer failed, falling back:', e)
        // fall through to return cleaned snippets
      }
    }

    // Fallback: return the cleaned text directly
    return NextResponse.json({
      questionText: questionSnippet,
      answerText: answerSnippet,
    })
  } catch (err: any) {
    console.error('❌ fetchNCERTQuestion error:', err)
    return NextResponse.json(
      { error: 'Internal error', details: err.message },
      { status: 500 }
    )
  }
}
