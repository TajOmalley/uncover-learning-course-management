"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface CitationItem {
  id: string
  title: string
  url: string
}

interface CitedMarkdownProps {
  content: string
  citations?: CitationItem[]
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname
  } catch {
    return url
  }
}

// Clean up concatenated text that might occur from AI generation
function cleanConcatenatedText(text: string): string {
  return text
    // Fix concatenated words like "crucialThe", "vitalYC", etc.
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Fix double spaces
    .replace(/\s+/g, ' ')
    // Clean up any remaining concatenated text
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    .trim()
}

// Intelligently detect and underline factual claims based on citations
function transformTextWithIntelligentCitations(text: string, citations: CitationItem[]) {
  if (!citations || citations.length === 0) {
    return [cleanConcatenatedText(text)]
  }

  const cleanedText = cleanConcatenatedText(text)
  const nodes: React.ReactNode[] = []
  
  // Create a map of citation IDs to citation objects
  const citationMap = new Map<string, CitationItem>()
  citations.forEach(citation => {
    citationMap.set(citation.id, citation)
  })

  // Define common factual claim patterns to look for
  const factualPatterns = [
    // Definitions
    /\b(?:is|are|refers to|means|defined as)\s+[^.!?]+/gi,
    // Statistics and numbers
    /\b\d+(?:\.\d+)?\s+(?:percent|%|million|billion|thousand|hundred)/gi,
    // Dates
    /\b(?:in|during|since|from|between)\s+\d{4}/gi,
    // Named entities and concepts
    /\b(?:the|a|an)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:is|are|refers to|means)/gi,
    // Economic concepts (for economics content)
    /\b(?:demand|supply|price|market|economy|economic|law of|principle of)/gi,
  ]

  let currentText = cleanedText
  let citationIndex = 0

  // For each citation, try to find a matching factual claim in the text
  citations.forEach((citation, index) => {
    // Extract key terms from the citation title
    const titleWords = citation.title.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    
    // Look for sentences that contain these key terms
    const sentences = currentText.split(/(?<=[.!?])\s+/)
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceLower = sentence.toLowerCase()
      
      // Check if this sentence contains key terms from the citation
      const hasKeyTerms = titleWords.some(word => sentenceLower.includes(word))
      
      // Check if this sentence matches any factual patterns
      const hasFactualPattern = factualPatterns.some(pattern => pattern.test(sentence))
      
      if (hasKeyTerms || hasFactualPattern) {
        // Find the position of this sentence in the original text
        const sentenceStart = currentText.indexOf(sentence)
        const sentenceEnd = sentenceStart + sentence.length
        
        // Add text before this sentence
        if (sentenceStart > 0) {
          nodes.push(currentText.slice(0, sentenceStart))
        }
        
        // Add the underlined sentence
        nodes.push(
          <TooltipProvider key={`citation-${citation.id}-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline underline-offset-4 decoration-dotted cursor-help">
                  {sentence}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs space-y-1">
                  <div className="font-medium">{citation.title}</div>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#47624f] hover:underline"
                  >
                    {extractDomain(citation.url)} ↗
                  </a>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
        
        // Update currentText to continue processing
        currentText = currentText.slice(sentenceEnd)
        break
      }
    }
  })
  
  // Add any remaining text
  if (currentText.length > 0) {
    nodes.push(currentText)
  }
  
  return nodes.length > 0 ? nodes : [cleanedText]
}

export function CitedMarkdown({ content, citations }: CitedMarkdownProps) {

  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({children}) => <h1 className="text-3xl font-bold text-[#000000] mb-6 mt-0 border-b-2 border-[#47624f] pb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-2xl font-semibold text-[#47624f] mb-4 mt-8">{children}</h2>,
          h3: ({children}) => <h3 className="text-xl font-medium text-[#707D7F] mb-3 mt-6">{children}</h3>,
                     p: ({ node, children }) => {
             // Post-process text nodes inside paragraphs for intelligent citations
             const flat = React.Children.toArray(children)
             const processed: React.ReactNode[] = []
             flat.forEach((child, idx) => {
               if (typeof child === 'string') {
                 processed.push(...transformTextWithIntelligentCitations(child, citations || []))
               } else {
                 processed.push(child)
               }
             })
             return <p className="text-[#000000] leading-relaxed mb-4 text-base">{processed}</p>
           },
          ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1 text-[#000000]">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-[#000000]">{children}</ol>,
          li: ({children}) => <li className="text-[#000000] leading-relaxed">{children}</li>,
          strong: ({children}) => <strong className="font-semibold text-[#000000]">{children}</strong>,
          em: ({children}) => <em className="italic text-[#707D7F]">{children}</em>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-[#47624f] pl-4 italic text-[#707D7F] mb-4">{children}</blockquote>,
          code: ({children}) => <code className="bg-[#C9F2C7]/30 px-2 py-1 rounded text-sm font-mono text-[#47624f]">{children}</code>,
          pre: ({children}) => <pre className="bg-[#C9F2C7]/20 p-4 rounded-lg border overflow-x-auto text-sm">{children}</pre>,
        }}
      >
        {content}
      </ReactMarkdown>

      {citations && citations.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-sm font-semibold text-[#707D7F] mb-2">Sources</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {citations.map(c => (
              <li key={c.id}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#47624f] hover:underline">
                  [{c.id}] {c.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}


