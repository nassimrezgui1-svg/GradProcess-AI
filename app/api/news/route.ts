import { NextRequest, NextResponse } from "next/server"
import Parser from "rss-parser"

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "GradProcessAI/1.0 (news aggregator)" },
})

// Free, credible RSS feeds
const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business", credibility: "high" },
  { url: "https://www.theguardian.com/uk/business/rss", source: "The Guardian", credibility: "high" },
  { url: "https://www.cityam.com/feed/", source: "City A.M.", credibility: "high" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", source: "MarketWatch", credibility: "high" },
  { url: "https://www.ft.com/rss/home", source: "Financial Times", credibility: "high" },
  { url: "https://www.economist.com/finance-and-economics/rss.xml", source: "The Economist", credibility: "high" },
  { url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", source: "CNBC Business", credibility: "high" },
  { url: "https://www.cnbc.com/id/19854910/device/rss/rss.html", source: "CNBC Finance", credibility: "high" },
  { url: "https://techcrunch.com/feed/", source: "TechCrunch", credibility: "high" },
  { url: "https://www.wired.com/feed/rss", source: "Wired", credibility: "high" },
]

// Keywords per sector for relevance filtering — higher-weight terms are listed first
const SECTOR_KEYWORDS: Record<string, string[]> = {
  banking: [
    "bank", "banking", "interest rate", "boe", "bank of england", "central bank", "fed", "federal reserve",
    "hsbc", "barclays", "lloyds", "natwest", "santander", "jpmorgan", "goldman sachs", "deutsche bank",
    "credit", "mortgage", "loan", "open banking", "fintech", "neobank", "digital bank",
    "basel", "mifid", "capital requirement", "stress test", "monetary policy", "financial services", "lender", "payment",
  ],
  "investment banking": [
    "investment bank", "ipo", "initial public offering", "m&a", "merger", "acquisition", "takeover", "deal",
    "capital market", "equity market", "debt capital", "bond issuance", "underwriting",
    "goldman sachs", "morgan stanley", "jpmorgan", "barclays capital", "ubs", "credit suisse", "lazard", "rothschild",
    "private equity", "leveraged buyout", "lbo", "spac", "secondary offering", "syndication",
  ],
  consulting: [
    "consulting", "consultancy", "management consultant",
    "mckinsey", "bcg", "bain", "deloitte", "pwc", "kpmg", "ey", "accenture", "oliver wyman", "roland berger",
    "strategy consulting", "transformation", "advisory", "operating model", "digital transformation",
    "restructuring", "cost optimisation", "due diligence", "post-merger integration",
  ],
  "asset management": [
    "asset management", "asset manager", "fund manager", "investment fund", "aum", "assets under management",
    "blackrock", "vanguard", "fidelity", "abrdn", "schroders", "legal & general", "aviva investors", "man group",
    "etf", "mutual fund", "pension fund", "hedge fund", "passive investing", "active management",
    "portfolio", "institutional investor", "yield", "fixed income", "equity fund",
  ],
  technology: [
    "artificial intelligence", "machine learning", "large language model", "generative ai", "openai", "anthropic",
    "microsoft", "google", "apple", "amazon", "meta", "nvidia", "semiconductor", "chip", "quantum computing",
    "cybersecurity", "data breach", "cloud computing", "saas", "software", "startup", "venture capital",
    "tech ipo", "regulation ai", "digital economy", "automation", "robotics",
  ],
  law: [
    "law firm", "legal", "solicitor", "barrister", "magic circle",
    "clifford chance", "linklaters", "freshfields", "allen & overy", "slaughter and may", "herbert smith",
    "litigation", "corporate law", "mergers and acquisitions", "regulatory", "compliance", "legal services",
    "supreme court", "court ruling", "legislation", "legal tech", "gdpr", "data protection",
  ],
  insurance: [
    "insurance", "insurer", "underwriting", "reinsurance", "actuarial",
    "lloyd's of london", "aviva", "axa", "zurich", "allianz", "legal & general", "prudential",
    "premium", "claims", "insurtech", "cyber insurance", "parametric insurance",
    "nat cat", "climate risk", "solvency", "fca insurance",
  ],
  "wealth management": [
    "wealth management", "private banking", "private bank", "hnwi", "ultra high net worth", "family office",
    "ubs wealth", "credit suisse private", "julius baer", "coutts", "rathbones", "investec", "st james's place",
    "financial planning", "inheritance tax", "estate planning", "discretionary portfolio", "iht", "trust",
  ],
  fmcg: [
    "fmcg", "consumer goods", "fast moving consumer", "unilever", "p&g", "procter & gamble", "nestle", "diageo",
    "coca-cola", "pepsi", "reckitt", "ab inbev", "kraft heinz", "mars", "mondelez",
    "retail", "supermarket", "tesco", "sainsbury", "aldi", "lidl", "supply chain", "brand",
    "consumer spending", "inflation consumer", "private label",
  ],
  energy: [
    "energy", "oil price", "gas price", "renewable energy", "net zero", "carbon emissions", "climate change",
    "bp", "shell", "exxon", "totalenergies", "equinor", "rwe", "national grid", "drax",
    "solar", "wind farm", "offshore wind", "hydrogen", "nuclear power", "energy transition",
    "ofgem", "energy regulator", "electricity price", "fossil fuel", "carbon market",
  ],
  healthcare: [
    "healthcare", "pharmaceutical", "nhs", "biotech", "clinical trial", "drug approval", "fda", "mhra",
    "pfizer", "astrazeneca", "gsk", "eli lilly", "johnson & johnson", "roche", "novartis",
    "medical device", "medtech", "digital health", "telemedicine", "hospital", "patient", "vaccine",
    "mental health", "oncology", "gene therapy", "health policy",
  ],
  "public sector": [
    "government", "public sector", "civil service", "chancellor", "budget", "autumn statement", "spending review",
    "treasury", "whitehall", "local authority", "council", "nhs", "public spending", "policy reform",
    "minister", "cabinet", "public services", "regulation", "ofsted", "ofcom", "infrastructure",
  ],
  engineering: [
    "engineering", "infrastructure", "construction", "aerospace", "defence", "manufacturing",
    "rolls royce", "bae systems", "atkins", "arup", "jacobs", "network rail", "hs2", "national highways",
    "automotive", "electric vehicle", "ev", "semiconductor manufacturing", "nuclear", "space",
    "net zero engineering", "civil engineering", "structural", "process engineering",
  ],
}

// Cache: { sector: { items, fetchedAt } }
const cache: Record<string, { items: any[]; fetchedAt: number }> = {}
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function scoreArticle(item: any, keywords: string[]): number {
  const text = `${item.title || ""} ${item.contentSnippet || item.summary || ""}`.toLowerCase()
  return keywords.reduce((score, kw) => score + (text.includes(kw.toLowerCase()) ? 1 : 0), 0)
}

function cleanSnippet(text: string): string {
  return (text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180)
}

export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get("sector")?.toLowerCase() || "banking"
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1"

  // Return cache if fresh
  if (!forceRefresh && cache[sector] && Date.now() - cache[sector].fetchedAt < CACHE_TTL) {
    return NextResponse.json({ items: cache[sector].items, cached: true })
  }

  const keywords = SECTOR_KEYWORDS[sector] || SECTOR_KEYWORDS.banking

  // Determine which feeds are most relevant for this sector
  const feedsToFetch = sector === "technology"
    ? RSS_FEEDS.filter(f => ["TechCrunch", "Wired", "BBC Business", "CNBC Business", "The Guardian"].includes(f.source))
    : sector === "law"
    ? RSS_FEEDS.filter(f => ["BBC Business", "The Guardian", "City A.M.", "Financial Times"].includes(f.source))
    : RSS_FEEDS.filter(f => !["TechCrunch", "Wired"].includes(f.source))

  const results = await Promise.allSettled(
    feedsToFetch.map(feed =>
      parser.parseURL(feed.url).then(parsed => ({ feed, items: parsed.items || [] }))
    )
  )

  const allItems: any[] = []

  for (const r of results) {
    if (r.status !== "fulfilled") continue
    const { feed, items } = r.value
    for (const item of items) {
      const score = scoreArticle(item, keywords)
      if (score < 2) continue
      allItems.push({
        id: item.guid || item.link || item.title,
        title: item.title?.trim() || "Untitled",
        snippet: cleanSnippet(item.contentSnippet || item.summary || item.content || ""),
        url: item.link || item.enclosure?.url || "",
        source: feed.source,
        credibility: feed.credibility,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        relevanceScore: score,
      })
    }
  }

  // Sort by relevance then by date
  allItems.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  // Deduplicate by title similarity
  const seen = new Set<string>()
  const deduped = allItems.filter(item => {
    const key = item.title.toLowerCase().slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const finalItems = deduped.slice(0, 20)
  cache[sector] = { items: finalItems, fetchedAt: Date.now() }

  return NextResponse.json({ items: finalItems, cached: false, count: finalItems.length })
}
