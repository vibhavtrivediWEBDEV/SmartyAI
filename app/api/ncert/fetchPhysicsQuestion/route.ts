// app/api/ncert/fetchPhysicsQuestion/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

// PDF-parse for raw text extraction
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse') as (data: Buffer) => Promise<{ text: string }>

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { subject, grade, chapter, userQuestion } = await request.json()

    // Validate inputs
    if (!subject || !grade || !chapter || !userQuestion) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1) Load & parse PDF
    const pdfPath = path.join(process.cwd(), 'data', `ncert-12-ph-ch-1.pdf`)
    
    // Check if the file exists
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ 
        success: false,
        error: `Physics Chapter ${chapter} PDF not found` 
      }, { status: 404 })
    }
    
    const data = fs.readFileSync(pdfPath)
    const { text: pdfText } = await pdfParse(data)

    // 2) Ask GPT to answer the physics question based on the PDF content
    const systemMessage = {
      role: 'system',
      content: `
You are an expert NCERT physics teacher. Your task is to answer the student's physics question based ONLY on the content from the NCERT physics textbook provided below.

Follow these guidelines:
1. Only use information present in the provided textbook content
2. If the question cannot be answered from the provided content, say so clearly
3. Format all mathematical expressions properly in LaTeX using \\( \\) for inline and \\[ \\] for display math
4. Use \\frac{numerator}{denominator} for fractions
5. Properly format all physics equations, units, and symbols
6. Structure your answer clearly with appropriate headings if needed
7. Include relevant examples from the textbook if available
8. For physics formulas, ensure proper vector notation where applicable

Return a JSON object with:
- "success": boolean indicating if an answer was found
- "answer": your detailed answer to the question
- "relatedConcepts": array of 2-3 related concepts from the chapter
      `.trim(),
    }
    
    const userMessage = {
      role: 'user',
      content: `
Physics Grade ${grade}, Chapter ${chapter}

Student's Question: ${userQuestion}

Textbook Content:
\`\`\`
${pdfText.substring(0, 15000)} // Limiting content length to avoid token limits
\`\`\`
      `.trim(),
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, userMessage],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" } // Ensure JSON response
    })

    const raw = completion.choices[0].message.content.trim()
    let parsed
    
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      console.error('❌ GPT output not valid JSON:', raw)
      // Fallback: return raw response
      return NextResponse.json({
        success: true,
        answer: raw,
        relatedConcepts: []
      })
    }

    // Format the response for the frontend
    return NextResponse.json({
      success: true,
      answer: parsed.answer || "I couldn't find specific information about that in the textbook.",
      relatedConcepts: parsed.relatedConcepts || []
    })
    
  } catch (err: any) {
    console.error('❌ Error in fetchPhysicsQuestion:', err)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal error fetching physics information',
        details: err.message 
      },
      { status: 500 }
    )
  }
}