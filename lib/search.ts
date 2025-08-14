import { URL } from 'url'

export interface SearchSource {
  id: string
  title: string
  url: string
  snippet?: string
}

export interface BuildQueryParams {
  subject: string
  level: string
  unitTitle: string
  unitDescription?: string
}

function isHttpUrl(maybeUrl: string): boolean {
  try {
    const parsed = new URL(maybeUrl)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeUrl(maybeUrl: string): string {
  try {
    const parsed = new URL(maybeUrl)
    // remove hash and search for dedupe purposes
    parsed.hash = ''
    parsed.search = ''
    return parsed.toString()
  } catch {
    return maybeUrl
  }
}



export function buildSearchQuery(params: BuildQueryParams): string {
  const parts = [
    params.subject,
    params.level,
    params.unitTitle,
    params.unitDescription || ''
  ].filter(Boolean)
  return parts.join(' ').slice(0, 500)
}

export async function searchWeb(query: string): Promise<SearchSource[]> {
  const provider = (process.env.CITATIONS_SEARCH_PROVIDER || 'tavily').toLowerCase()
  
  console.log('SearchWeb called with query:', query)
  console.log('Search provider:', provider)

  let rawResults: Array<{ title: string; url: string; snippet?: string }> = []

  if (provider === 'tavily') {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is not configured')
    }
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        include_answer: false,
        search_depth: 'advanced',
        max_results: 10
      })
    })
    if (!resp.ok) {
      throw new Error(`Tavily search failed: ${resp.status}`)
    }
    const data = await resp.json()
    const results = Array.isArray(data.results) ? data.results : []
    rawResults = results.map((r: any) => ({ title: r.title || r.url, url: r.url, snippet: r.snippet }))
  } else if (provider === 'bing') {
    const apiKey = process.env.BING_SEARCH_API_KEY
    if (!apiKey) {
      throw new Error('BING_SEARCH_API_KEY is not configured')
    }
    const resp = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey }
    })
    if (!resp.ok) {
      throw new Error(`Bing search failed: ${resp.status}`)
    }
    const data = await resp.json()
    const webPages = data.webPages?.value || []
    rawResults = webPages.map((r: any) => ({ title: r.name, url: r.url, snippet: r.snippet }))
  } else if (provider === 'serpapi') {
    const apiKey = process.env.SERPAPI_API_KEY
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY is not configured')
    }
    const resp = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google&api_key=${apiKey}`)
    if (!resp.ok) {
      throw new Error(`SerpAPI search failed: ${resp.status}`)
    }
    const data = await resp.json()
    const organic = data.organic_results || []
    rawResults = organic.map((r: any) => ({ title: r.title, url: r.link, snippet: r.snippet }))
  } else {
    throw new Error(`Unsupported search provider: ${provider}`)
  }

  // Filter + dedupe
  const seen = new Set<string>()
  const cleaned = rawResults
    .filter(r => r && typeof r.url === 'string' && isHttpUrl(r.url))
    .map(r => ({ ...r, url: normalizeUrl(r.url) }))
    .filter(r => {
      if (seen.has(r.url)) return false
      seen.add(r.url)
      return true
    })

  // Assign stable ids S1..Sn
  const sources: SearchSource[] = cleaned.map((r, idx) => ({
    id: `S${idx + 1}`,
    title: r.title || r.url,
    url: r.url,
    snippet: r.snippet
  }))

  console.log('SearchWeb returning sources:', sources)
  return sources
}


