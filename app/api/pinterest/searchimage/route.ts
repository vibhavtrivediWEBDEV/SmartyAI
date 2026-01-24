import axios from "axios";

async function fetchPinterestData(query: any, priceMin: any, priceMax: any, nextToken: any) {
    const encodedQuery = encodeURIComponent(query);

    // Construct the data payload
    const data = {
        options: {
            applied_filters: null,
            appliedProductFilters: '---',
            article: null,
            auto_correction_disabled: false,
            corpus: null,
            customized_rerank_type: null,
            domains: null,
            filters: null,
            journey_depth: null,
            page_size: null,
            price_max: priceMax,
            price_min: priceMin,
            query_pin_sigs: null,
            query: encodedQuery,
            redux_normalize_feed: true,
            rs: 'ac',
            scope: 'pins',
            selected_one_bar_modules: null,
            source_id: null,
            source_module_id: null,
            top_pin_id: null,
            bookmarks: nextToken ? [nextToken] : [], // Add the next token if available
        },
        context: {},
    };

    const response = await axios.get(`https://in.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Frs%3Dac%26len%3D2%26q%3D${encodedQuery}`, {
        headers:
        {
            'accept': 'application/json, text/javascript, */*, q=0.01',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://www.pinterest.com/',
            'screen-dpr': '2',
            'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
            'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Google Chrome";v="133.0.6943.142", "Chromium";v="133.0.6943.142"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"macOS"',
            'sec-ch-ua-platform-version': '"15.2.0"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'x-app-version': 'e47b496',
            'x-b3-flags': '0',
            'x-b3-parentspanid': '75fb673b2c5ee1d2',
            'x-b3-spanid': '202b81ef1efa2538',
            'x-b3-traceid': '75fb673b2c5ee1d2',
            'x-pinterest-appstate': 'active',
            'x-pinterest-pws-handler': 'www/ideas.js',
            'x-pinterest-source-url': '/ideas/',
            'x-requested-with': 'XMLHttpRequest',
        },
        params: {
            data: JSON.stringify(data),
        },
    });

    // Extract the next token from the response
    const responseData = response.data;
    const nextPageToken = responseData?.bookmarks || null;

    return {
        data: responseData,
        nextPageToken,
    };
}

export async function POST(request: Request) {
    try {
        const { search, bookmark = null, priceMin = 1000, priceMax = 1000 } = await request.json();
        
        if (!search) {
            return Response.json({ success: false, error: "Search query is required" }, { status: 400 });
        }
        
        const result = await fetchPinterestData(search, priceMin, priceMax, bookmark);
        
        // Extract image URLs from the response
        const filteredData = result.data.resource_response.data.results.map((item: any) => item.images["474x"].url);
        const nextBookmark = result.data.resource_response.bookmark;
        
        return Response.json({ 
            success: true, 
            images: filteredData,
            bookmark: nextBookmark
        }, { status: 200 });
    } catch (error) {
        console.error("Pinterest search error:", error);
        return Response.json({ success: false, error: String(error) }, { status: 500 });
    }
}