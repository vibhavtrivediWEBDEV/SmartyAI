/**
 * Web Search API - Direct browser navigation (no external API needed)
 * Returns instructions for browser automation
 */

import { NextRequest, NextResponse } from 'next/server';

interface SearchRequest {
  query: string;
  provider?: 'direct' | 'google';
  numResults?: number;
  includeContent?: boolean;
  searchDepth?: 'basic' | 'advanced';
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position?: number;
  fullContent?: string;
}

interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  answer?: string;
  searchTime?: number;
  error?: string;
  browserUrl?: string; // URL to open in browser
}

/**
 * Search using Google Direct URL (no API key needed)
 * Returns the search URL for browser automation
 */
async function searchWithGoogleDirect(query: string): Promise<SearchResponse> {
  const startTime = Date.now();
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const googleSearchUrl = `https://www.google.com/search?q=${encodedQuery}`;
    
    // Return the URL for browser to navigate to
    return {
      success: true,
      browserUrl: googleSearchUrl,
      results: [
        {
          title: `Search: ${query}`,
          url: googleSearchUrl,
          snippet: `Direct Google search for "${query}"`,
          position: 1
        }
      ],
      searchTime: (Date.now() - startTime) / 1000
    };
  } catch (error) {
    throw new Error(`Search failed: ${error}`);
  }
}

/**
 * Search using Google Custom Search API (optional - requires API key)
 */
async function searchWithGoogleAPI(query: string, numResults: number = 10): Promise<SearchResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    // Fallback to direct browser navigation
    return searchWithGoogleDirect(query);
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${numResults}`
    );

    if (!response.ok) {
      // Fallback to direct navigation if API fails
      return searchWithGoogleDirect(query);
    }

    const data = await response.json();
    
    const results: SearchResult[] = (data.items || []).map((item: any, index: number) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      position: index + 1
    }));

    return {
      success: true,
      results,
      browserUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      searchTime: (Date.now() - startTime) / 1000
    };
  } catch (error) {
    // Fallback to direct navigation
    return searchWithGoogleDirect(query);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, provider = 'direct', numResults = 10 } = body;

    if (!query) {
      return NextResponse.json<SearchResponse>(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Use Google Direct (no API key) as primary method
    const response = await searchWithGoogleDirect(query);

    return NextResponse.json<SearchResponse>(response);
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json<SearchResponse>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Search API ready (Direct Browser Navigation)',
    providers: {
      direct: 'Google search URL (no API key needed)',
      google: 'Google Custom Search API (optional)'
    },
    note: 'Browser automation handles search directly via URL navigation'
  });
}
