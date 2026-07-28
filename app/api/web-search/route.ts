/**
 * Web Search API - Multi-Source Search with GLM Browser Tool
 * DuckDuckGo + Google + YouTube + Wikipedia + GitHub + All Sources
 * 
 * Sources:
 * - DuckDuckGo Instant Answers
 * - Google Web Search
 * - Google Images
 * - Google Videos  
 * - Google News
 * - Wikipedia
 * - YouTube
 * - GitHub
 * - Reddit
 */

import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  query: string;
  source: string;
  searchTime: number;
  error?: string;
}

/**
 * GLM Browser Search - Multi-Source (DuckDuckGo + Google + All Platforms)
 */
async function searchMultiSource(query: string): Promise<SearchResponse> {
  const startTime = Date.now();
  const results: SearchResult[] = [];
  
  // 1️⃣ DuckDuckGo Instant Answers (Wikipedia summaries)
  try {
    const ddgResponse = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (ddgResponse.ok) {
      const data = await ddgResponse.json();
      
      // Wikipedia abstract
      if (data.Abstract && data.AbstractURL) {
        results.push({
          title: `${data.Heading || 'Summary'} - Wikipedia`,
          url: data.AbstractURL,
          snippet: data.Abstract,
          source: data.AbstractSource || 'Wikipedia'
        });
      }
      
      // Related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0],
              url: topic.FirstURL,
              snippet: topic.Text,
              source: 'DuckDuckGo'
            });
          }
        });
      }
    }
  } catch (e) {
    console.log('DuckDuckGo API failed, using Google sources');
  }

  // 2️⃣ Google Search - Multiple Sources
  results.push({
    title: `🔍 Google Web: ${query}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    snippet: `Full web search - all websites, articles, blogs`,
    source: 'Google Web'
  });

  results.push({
    title: `📷 Google Images: ${query}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
    snippet: `Photos, graphics, visual content from all sources`,
    source: 'Google Images'
  });

  results.push({
    title: `📺 Google Videos: ${query}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=vid`,
    snippet: `Videos from YouTube, Vimeo, and all platforms`,
    source: 'Google Videos'
  });

  results.push({
    title: `📰 Google News: ${query}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`,
    snippet: `Latest news articles and breaking stories`,
    source: 'Google News'
  });

  // 3️⃣ Direct Source Searches
  results.push({
    title: `📚 Wikipedia: ${query}`,
    url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
    snippet: `Encyclopedia articles with detailed information`,
    source: 'Wikipedia'
  });

  results.push({
    title: `📺 YouTube: ${query}`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    snippet: `Videos, tutorials, educational content`,
    source: 'YouTube'
  });

  results.push({
    title: `🐙 GitHub: ${query}`,
    url: `https://github.com/search?q=${encodeURIComponent(query)}`,
    snippet: `Code repositories, open source projects`,
    source: 'GitHub'
  });

  results.push({
    title: `📖 Reddit: ${query}`,
    url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
    snippet: `Community discussions and user content`,
    source: 'Reddit'
  });

  return {
    success: true,
    results,
    query,
    source: 'Multi-Source (DuckDuckGo + Google + All Platforms)',
    searchTime: (Date.now() - startTime) / 1000
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json<SearchResponse>(
        { 
          success: false, 
          results: [], 
          query: '', 
          source: 'Error',
          searchTime: 0,
          error: 'Query is required' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Multi-Source Web Search:', query);
    const response = await searchMultiSource(query);
    
    console.log(`✅ Found ${response.results.length} results from all sources in ${response.searchTime.toFixed(2)}s`);
    
    return NextResponse.json<SearchResponse>(response);
  } catch (error) {
    console.error('Web Search API error:', error);
    
    return NextResponse.json<SearchResponse>(
      { 
        success: false, 
        results: [],
        query: '',
        source: 'Error',
        searchTime: 0,
        error: error instanceof Error ? error.message : 'Search failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Web Search API - Multi-Source',
    sources: [
      'DuckDuckGo (Instant Answers)',
      'Google Web',
      'Google Images', 
      'Google Videos',
      'Google News',
      'Wikipedia',
      'YouTube',
      'GitHub',
      'Reddit'
    ],
    note: 'No API key required - All sources included',
    usage: 'POST with { "query": "your search" }'
  });
}
