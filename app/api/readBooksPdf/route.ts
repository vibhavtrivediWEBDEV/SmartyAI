import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const prompt = formData.get('prompt') as string

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt must be a string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!file) {
      return new Response(JSON.stringify({ error: 'PDF file is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convert File to a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to OpenAI
    const uploadedFile = await openai.files.create({
      file: buffer,
      purpose: 'assistants',
    })

    // Create assistant with file_search tool
    const assistant = await openai.beta.assistants.create({
      name: 'NCERT Assistant',
      instructions: 'Answer questions based on uploaded NCERT PDF.',
      tools: [{ type: 'file_search' }],
      model: 'gpt-4o',
    })

    const thread = await openai.beta.threads.create()

    // Create message in thread with prompt and file reference
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt,
      file_ids: [uploadedFile.id],
    })

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    })

    // Poll until run completes
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    }

    // Get assistant response
    const messages = await openai.beta.threads.messages.list(thread.id)
    const textResponse = messages.data[0].content[0].text.value

    return new Response(JSON.stringify({ success: true, answer: textResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('OpenAI PDF QA Error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
