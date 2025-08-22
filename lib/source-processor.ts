export interface SourceFact {
  id: string
  fact: string
  sourceId: string
  sourceTitle: string
  sourceUrl: string
  category: 'definition' | 'concept' | 'example' | 'principle' | 'application'
  confidence: number
}

export interface ProcessedSource {
  id: string
  title: string
  url: string
  facts: SourceFact[]
  summary: string
}

export interface SourceAnalysisResult {
  sources: ProcessedSource[]
  factBank: SourceFact[]
  topicSummary: string
}

export async function analyzeSources(sources: Array<{ id: string; title: string; url: string; snippet?: string }>): Promise<SourceAnalysisResult> {
  const processedSources: ProcessedSource[] = []
  const allFacts: SourceFact[] = []
  
  // For each source, extract key facts and information
  for (const source of sources) {
    const facts = await extractFactsFromSource(source)
    const summary = await generateSourceSummary(source, facts)
    
    processedSources.push({
      id: source.id,
      title: source.title,
      url: source.url,
      facts,
      summary
    })
    
    allFacts.push(...facts)
  }
  
  // Generate overall topic summary
  const topicSummary = await generateTopicSummary(processedSources)
  
  return {
    sources: processedSources,
    factBank: allFacts,
    topicSummary
  }
}

async function extractFactsFromSource(source: { id: string; title: string; url: string; snippet?: string }): Promise<SourceFact[]> {
  const facts: SourceFact[] = []
  
  // Extract basic information from the source snippet if available
  if (source.snippet) {
    facts.push({
      id: `${source.id}_fact_1`,
      fact: source.snippet,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'concept',
      confidence: 0.8
    })
  }
  
  // Create facts based on source title analysis
  const titleWords = source.title.toLowerCase().split(' ')
  const urlWords = source.url.toLowerCase().split('/').join(' ').split('?').join(' ').split('&').join(' ').split(' ')
  
  // Extract key concepts from title and URL
  const keyTerms = [...titleWords, ...urlWords].filter(word => 
    word.length > 3 && 
    !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'will', 'been', 'they', 'their', 'what', 'when', 'where', 'which', 'there', 'here'].includes(word)
  )
  
  // Create a fact from the source title
  facts.push({
    id: `${source.id}_fact_title`,
    fact: `Information about ${source.title}`,
    sourceId: source.id,
    sourceTitle: source.title,
    sourceUrl: source.url,
    category: 'concept',
    confidence: 0.9
  })
  
  // Add domain-specific facts based on the source
  if (source.url.includes('khanacademy.org')) {
    facts.push({
      id: `${source.id}_fact_khan`,
      fact: `Educational content from Khan Academy covering ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'concept',
      confidence: 0.9
    })
  }
  
  if (source.url.includes('investopedia.com')) {
    facts.push({
      id: `${source.id}_fact_investopedia`,
      fact: `Financial and economic definitions from Investopedia: ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'definition',
      confidence: 0.9
    })
  }
  
  if (source.url.includes('youtube.com')) {
    facts.push({
      id: `${source.id}_fact_youtube`,
      fact: `Video tutorial content: ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'example',
      confidence: 0.7
    })
  }
  
  // Add facts based on title keywords
  if (titleWords.includes('elasticity') || titleWords.includes('elastic')) {
    facts.push({
      id: `${source.id}_fact_elasticity`,
      fact: `Elasticity concepts and applications: ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'concept',
      confidence: 0.9
    })
  }
  
  if (titleWords.includes('demand') || titleWords.includes('supply')) {
    facts.push({
      id: `${source.id}_fact_demand_supply`,
      fact: `Demand and supply analysis: ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'concept',
      confidence: 0.9
    })
  }
  
  if (titleWords.includes('price') || titleWords.includes('cost')) {
    facts.push({
      id: `${source.id}_fact_price`,
      fact: `Price-related economic concepts: ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'concept',
      confidence: 0.8
    })
  }
  
  if (titleWords.includes('example') || titleWords.includes('case') || titleWords.includes('application')) {
    facts.push({
      id: `${source.id}_fact_example`,
      fact: `Real-world examples and applications: ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'example',
      confidence: 0.8
    })
  }
  
  if (titleWords.includes('definition') || titleWords.includes('define') || titleWords.includes('meaning')) {
    facts.push({
      id: `${source.id}_fact_definition`,
      fact: `Definitions and explanations: ${source.title}`,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      category: 'definition',
      confidence: 0.9
    })
  }
  
  return facts
}

async function generateSourceSummary(source: { id: string; title: string; url: string; snippet?: string }, facts: SourceFact[]): Promise<string> {
  return `${source.title} provides ${facts.length} key pieces of information related to the topic.`
}

async function generateTopicSummary(sources: ProcessedSource[]): Promise<string> {
  const totalFacts = sources.reduce((sum, source) => sum + source.facts.length, 0)
  return `This topic is supported by ${sources.length} authoritative sources containing ${totalFacts} key facts and concepts.`
}
