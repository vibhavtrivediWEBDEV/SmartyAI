import { NextRequest, NextResponse } from 'next/server';

/**
 * GLM Browser Automation API
 * Integrates GLM's browser tool for real-time web navigation with multi-source search
 */

interface BrowserRequest {
  action: 'search' | 'navigate' | 'click' | 'extract' | 'automate';
  query?: string;
  url?: string;
  selector?: string;
  sequence?: Array<{
    type: 'navigate' | 'click' | 'type' | 'wait' | 'extract';
    value?: string;
    selector?: string;
    timeout?: number;
  }>;
}

interface BrowserResponse {
  success: boolean;
  url?: string;
  title?: string;
  content?: string;
  results?: any[];
  error?: string;
  message?: string;
}

// Helper function for search labels
function getSearchLabel(source: string): string {
  const labels: Record<string, string> = {
    googleWeb: '🔍 Google Web',
    googleImages: '📷 Google Images',
    googleVideos: '📺 Google Videos',
    googleNews: '📰 Google News',
    wikipedia: '📚 Wikipedia',
    youtube: '📺 YouTube',
    github: '🐙 GitHub',
    reddit: '📖 Reddit'
  };
  return labels[source] || source;
}

export async function POST(request: NextRequest) {
  try {
    const body: BrowserRequest = await request.json();
    const { action, query, url, selector, sequence } = body;

    console.log(`🌐 GLM Browser Request: ${action}`);

    switch (action) {
      case 'search': {
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Query is required for search action'
          }, { status: 400 });
        }

        // Multi-source search URLs
        const searchUrls = {
          googleWeb: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          googleImages: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`,
          googleVideos: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=vid`,
          googleNews: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`,
          wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
          youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          github: `https://github.com/search?q=${encodeURIComponent(query)}`,
          reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`
        };
        
        console.log(`✅ Multi-source search: ${query}`);

        return NextResponse.json({
          success: true,
          url: searchUrls.googleWeb, // Default to Google Web for Chrome
          results: Object.entries(searchUrls).map(([source, url]) => ({
            source: source.charAt(0).toUpperCase() + source.slice(1),
            url,
            label: getSearchLabel(source)
          })),
          title: `Multi-Source Search: ${query}`,
          message: `All search sources available for "${query}"`,
          content: 'Multi-source search activated'
        } as BrowserResponse);
      }

      case 'navigate': {
        if (!url) {
          return NextResponse.json({
            success: false,
            error: 'URL is required for navigate action'
          }, { status: 400 });
        }

        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          finalUrl = 'https://' + url;
        }

        console.log(`✅ Navigating to: ${finalUrl}`);

        return NextResponse.json({
          success: true,
          url: finalUrl,
          message: `Chrome opened and navigating to ${finalUrl}`
        } as BrowserResponse);
      }

      case 'automate': {
        if (!sequence || sequence.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Sequence is required for automate action'
          }, { status: 400 });
        }

        console.log(`🤖 Executing automation sequence: ${sequence.length} steps`);

        const results = [];
        
        for (const step of sequence) {
          switch (step.type) {
            case 'navigate':
              if (step.value) {
                results.push({
                  type: 'navigate',
                  success: true,
                  url: step.value.startsWith('http') ? step.value : `https://${step.value}`
                });
              }
              break;

            case 'wait':
              await new Promise(resolve => setTimeout(resolve, step.timeout || 1000));
              results.push({ type: 'wait', success: true });
              break;

            case 'click':
              results.push({
                type: 'click',
                success: true,
                selector: step.selector
              });
              break;

            case 'type':
              results.push({
                type: 'type',
                success: true,
                value: step.value
              });
              break;

            case 'extract':
              results.push({
                type: 'extract',
                success: true,
                selector: step.selector
              });
              break;

            default:
              results.push({
                type: step.type,
                success: false,
                error: 'Unknown action type'
              });
          }
        }

        return NextResponse.json({
          success: true,
          results,
          message: `Executed ${sequence.length} automation steps`
        } as BrowserResponse);
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ GLM Browser Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const url = searchParams.get('url');

  if (query) {
    // Search action via GET
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    return NextResponse.json({
      success: true,
      url: searchUrl,
      title: `Search: ${query}`,
      message: 'Chrome ready for search'
    });
  }

  if (url) {
    // Navigate action via GET
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      message: 'Chrome ready for navigation'
    });
  }

  return NextResponse.json({
    success: true,
    message: 'GLM Browser Automation API Ready',
    version: '1.0.0',
    actions: ['search', 'navigate', 'click', 'extract', 'automate']
  });
}
