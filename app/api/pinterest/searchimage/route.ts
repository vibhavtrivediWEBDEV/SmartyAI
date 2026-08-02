import axios from "axios";
import { getCurrentUser } from "@/lib/actions/auth.action";

async function fetchPinterestData(query: any, priceMin: any, priceMax: any, nextToken: any, mode?: string) {
    const hdQuery = mode === "education"
        ? `${String(query).trim()} educational diagram labeled high resolution`
        : `${String(query).trim()} mac wallpaper 4K UHD 3840x2160`;
    const encodedQuery = encodeURIComponent(hdQuery);

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
        const user = await getCurrentUser();
        if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const { search, bookmark = null, priceMin = 1000, priceMax = 1000, mode } = await request.json();
        
        if (typeof search !== "string" || !search.trim() || search.length > 500) {
            return Response.json({ success: false, error: "Search query is required" }, { status: 400 });
        }
        
        const result = await fetchPinterestData(search, priceMin, priceMax, bookmark, mode);
        
        const pins = result.data?.resource_response?.data?.results ?? [];
        const originals = pins.flatMap((item: any) => {
            const image = item.images?.orig ?? item.images?.originals ?? item.images?.["736x"] ?? item.images?.["474x"];
            if (!image?.url) return [];
            const url = image.url.replace(/\/\d+x\//, "/originals/");
            return [{ url, width: Number(image.width) || 0, height: Number(image.height) || 0 }];
        });
        const hdLandscape = originals.filter((image: { width: number; height: number }) =>
            mode === "education"
                ? image.width >= 600 && image.height >= 600
                : image.width >= 1280 && image.height >= 720 && image.width > image.height
        );
        const filteredData = hdLandscape
            .filter((image: { url: string }, index: number, images: Array<{ url: string }>) =>
                images.findIndex((candidate) => candidate.url === image.url) === index
            )
            .slice(0, 24);
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