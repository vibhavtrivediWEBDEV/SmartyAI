import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.trim()

  if (!username || !GITHUB_USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: 'A valid GitHub username is required' }, { status: 400 })
  }

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const response = await fetch(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&direction=desc`,
    {
      headers,
      next: { revalidate: 3600 },
    },
  )

  const data = await response.json()

  if (!response.ok) {
    const message = response.status === 403
      ? 'GitHub API rate limit exceeded. Configure GITHUB_TOKEN to increase the limit.'
      : data.message || 'Failed to fetch GitHub repositories'

    return NextResponse.json({ error: message }, { status: response.status })
  }

  return NextResponse.json(data)
}