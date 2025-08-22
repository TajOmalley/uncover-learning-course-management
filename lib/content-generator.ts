import { SourceFact, SourceAnalysisResult } from './source-processor'

export interface EmbeddedCitation {
  id: string
  sourceId: string
  sourceTitle: string
  sourceUrl: string
  factId: string
  text: string
  startIndex: number
  endIndex: number
}

export interface GeneratedContent {
  content: string
  citations: EmbeddedCitation[]
  sources: Array<{ id: string; title: string; url: string }>
}

export async function generateSourcedContent(
  topic: string,
  subject: string,
  level: string,
  sourceAnalysis: SourceAnalysisResult,
  customPrompt?: string
): Promise<GeneratedContent> {
  const llmProvider = process.env.LLM_PROVIDER || 'gemini'
  
  const systemPrompt = `You are an expert educational content creator who generates content with embedded citations. Your task is to create engaging, educational content that incorporates facts from provided sources.

CRITICAL INSTRUCTIONS:
1. Use the provided fact bank to create accurate, well-sourced content
2. Embed citations directly in the content using the format: [CITATION:factId]
3. Each factual statement should be linked to a specific fact from the sources
4. Write naturally flowing content that incorporates the cited facts seamlessly
5. Ensure every claim is supported by at least one source
6. Use markdown formatting for structure
7. IMPORTANT: Include citations frequently - aim for at least one citation per paragraph
8. Use different facts from the fact bank to provide comprehensive coverage

EXAMPLE FORMAT:
"Elasticity measures how responsive quantity demanded is to price changes [CITATION:S1_fact_elasticity]. When prices increase by 10% and demand decreases by 20%, the elasticity is 2.0 [CITATION:S2_fact_demand_supply]. This concept is fundamental to understanding market behavior [CITATION:S3_fact_concept]."

MATH FORMATTING:
- Inline math: $expression$
- Block math: $$expression$$
- Use proper LaTeX syntax

Write content that is:
- Engaging and accessible for ${level} students
- Well-structured with clear headings
- Educational and informative
- Appropriate for ${subject} students
- Tailored to the specific topic: ${topic}
- Rich with citations from the provided sources`

  const userPrompt = `Generate comprehensive reading content for: ${topic}

Subject: ${subject}
Level: ${level}

AVAILABLE FACTS AND SOURCES:
${sourceAnalysis.factBank.map(fact => 
  `[${fact.id}] ${fact.fact} (Source: ${fact.sourceTitle} - ${fact.sourceUrl})`
).join('\n')}

${customPrompt ? `CUSTOM INSTRUCTIONS: ${customPrompt}` : ''}

INSTRUCTIONS FOR CITATIONS:
- Use the [CITATION:factId] format to link factual statements to their sources
- Include at least one citation per paragraph
- Use different facts from the fact bank to provide comprehensive coverage
- Make sure every major concept or claim is supported by a citation
- Write naturally flowing content that incorporates the cited facts seamlessly

Create engaging, well-structured content that makes full use of the available sources and facts.`

  let generatedText = ''
  
  if (llmProvider === 'openai') {
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    })
    
    generatedText = completion.choices[0]?.message?.content || ''
  } else {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt)
    const response = await result.response
    generatedText = response.text()
  }
  
  // Parse embedded citations from the generated text
  const citations = parseEmbeddedCitations(generatedText, sourceAnalysis.factBank)
  
  // Clean the text by removing citation markers
  const cleanContent = generatedText.replace(/\[CITATION:[^\]]+\]/g, '')
  
  return {
    content: cleanContent,
    citations,
    sources: sourceAnalysis.sources.map(s => ({ id: s.id, title: s.title, url: s.url }))
  }
}

function parseEmbeddedCitations(content: string, factBank: SourceFact[]): EmbeddedCitation[] {
  const citations: EmbeddedCitation[] = []
  const citationRegex = /\[CITATION:([^\]]+)\]/g
  let match
  
  while ((match = citationRegex.exec(content)) !== null) {
    const factId = match[1]
    const fact = factBank.find(f => f.id === factId)
    
    if (fact) {
      // Find the sentence containing this citation
      const beforeCitation = content.substring(0, match.index)
      const afterCitation = content.substring(match.index + match[0].length)
      
      // Find sentence boundaries
      let sentenceStart = beforeCitation.lastIndexOf('.')
      if (sentenceStart === -1) sentenceStart = beforeCitation.lastIndexOf('!')
      if (sentenceStart === -1) sentenceStart = beforeCitation.lastIndexOf('?')
      if (sentenceStart === -1) sentenceStart = beforeCitation.lastIndexOf('\n')
      if (sentenceStart === -1) sentenceStart = 0
      else sentenceStart += 1
      
      let sentenceEnd = afterCitation.indexOf('.')
      if (sentenceEnd === -1) sentenceEnd = afterCitation.indexOf('!')
      if (sentenceEnd === -1) sentenceEnd = afterCitation.indexOf('?')
      if (sentenceEnd === -1) sentenceEnd = afterCitation.indexOf('\n')
      if (sentenceEnd === -1) sentenceEnd = afterCitation.length
      
      // Extract the full sentence
      const fullSentence = beforeCitation.substring(sentenceStart).trim() + ' ' + afterCitation.substring(0, sentenceEnd).trim()
      
      // Calculate positions in the cleaned content
      const cleanedContent = content.replace(/\[CITATION:[^\]]+\]/g, '')
      const cleanedSentence = fullSentence.replace(/\[CITATION:[^\]]+\]/g, '')
      
      // Find the position of this sentence in the cleaned content
      const sentenceIndex = cleanedContent.indexOf(cleanedSentence)
      
      if (sentenceIndex !== -1) {
        citations.push({
          id: `citation_${citations.length + 1}`,
          sourceId: fact.sourceId,
          sourceTitle: fact.sourceTitle,
          sourceUrl: fact.sourceUrl,
          factId: fact.id,
          text: cleanedSentence,
          startIndex: sentenceIndex,
          endIndex: sentenceIndex + cleanedSentence.length
        })
      }
    }
  }
  
  return citations
}
