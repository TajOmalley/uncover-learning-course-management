"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import 'katex/dist/katex.css'
import { InlineMath, BlockMath } from 'react-katex'


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

// Function to detect and render inline math expressions only (no block math)
function renderInlineMathInText(text: string): React.ReactNode[] {
  console.log('renderInlineMathInText called with:', text.substring(0, 100) + '...')
  
  const nodes: React.ReactNode[] = []
  let currentIndex = 0
  
  // Regex for inline math: $...$ (but not $$...$$) or [...]
  const inlineMathRegex = /(\$(?!\$)([^$\n]+?)\$|\[([^\]]+?)\])/g
  
  let inlineMatch
  while ((inlineMatch = inlineMathRegex.exec(text)) !== null) {
    // Determine which group matched and extract the math content
    let mathContent = ''
    if (inlineMatch[2]) {
      // Dollar sign format: $...$
      mathContent = inlineMatch[2]
      console.log('Found dollar sign inline math:', mathContent)
    } else if (inlineMatch[3]) {
      // Square bracket format: [...]
      mathContent = inlineMatch[3]
      console.log('Found square bracket inline math:', mathContent)
    }
    
    // Add text before the math
    if (inlineMatch.index > currentIndex) {
      nodes.push(text.slice(currentIndex, inlineMatch.index))
    }
    
    // Add the inline math
    try {
      nodes.push(
        <InlineMath key={`inline-math-${inlineMatch.index}`} math={mathContent} />
      )
    } catch (error) {
      console.error('Error rendering inline math:', error)
      // Fallback to raw text if math parsing fails
      const originalText = inlineMatch[0]
      nodes.push(<span key={`inline-math-error-${inlineMatch.index}`} className="font-mono bg-red-50 px-1 rounded">{originalText}</span>)
    }
    
    currentIndex = inlineMatch.index + inlineMatch[0].length
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    nodes.push(text.slice(currentIndex))
  }
  
  console.log('renderInlineMathInText returning', nodes.length, 'nodes')
  return nodes.length > 0 ? nodes : [text]
}

// Function to process text and split it into blocks, handling block math separately
function processTextWithMath(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let currentIndex = 0
  
  // Regex for block math: $$...$$
  const blockMathRegex = /\$\$([^$]+?)\$\$/g
  
  let blockMatch
  while ((blockMatch = blockMathRegex.exec(text)) !== null) {
    // Add text before the math (process it for inline math)
    if (blockMatch.index > currentIndex) {
      const textBefore = text.slice(currentIndex, blockMatch.index)
      nodes.push(...renderInlineMathInText(textBefore))
    }
    
    // Add the block math
    try {
      nodes.push(
        <div key={`block-math-${blockMatch.index}`} className="my-4 flex justify-center">
          <BlockMath math={blockMatch[1]} />
        </div>
      )
    } catch (error) {
      console.error('Error rendering block math:', error)
      // Fallback to raw text if math parsing fails
      nodes.push(<span key={`block-math-error-${blockMatch.index}`} className="font-mono bg-red-50 px-2 py-1 rounded">$${blockMatch[1]}$</span>)
    }
    
    currentIndex = blockMatch.index + blockMatch[0].length
  }
  
  // Add remaining text (process it for inline math)
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex)
    nodes.push(...renderInlineMathInText(remainingText))
  }
  
  return nodes.length > 0 ? nodes : [text]
}

// Simple citation highlighting - highlight every sentence that contains key terms
function transformTextWithIntelligentCitations(text: string, citations: CitationItem[]) {
  if (!citations || citations.length === 0) {
    return renderInlineMathInText(cleanConcatenatedText(text))
  }

  const cleanedText = cleanConcatenatedText(text)
  const nodes: React.ReactNode[] = []
  
  // Split text into sentences
  const sentences = cleanedText.split(/(?<=[.!?])\s+/)
  let currentText = cleanedText
  
  // For each citation, find sentences that might be related
  citations.forEach((citation, index) => {
    // Extract key terms from the citation title (more lenient)
    const titleWords = citation.title.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2) // Include shorter words
      .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
    
    // Look for sentences that contain any of these terms
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceLower = sentence.toLowerCase()
      
      // Check if this sentence contains any key terms from the citation
      const hasKeyTerms = titleWords.some(word => 
        word.length > 2 && sentenceLower.includes(word)
      )
      
      // Also check for common economic terms if this is economics content
      const economicTerms = ['consumer', 'choice', 'demand', 'supply', 'price', 'market', 'budget', 'constraint', 'indifference', 'curve', 'utility', 'preference', 'economics', 'theory', 'study', 'research', 'analysis']
      const hasEconomicTerms = economicTerms.some(term => sentenceLower.includes(term))
      
      // More lenient matching - highlight sentences that contain common academic terms
      const academicTerms = ['study', 'research', 'analysis', 'theory', 'model', 'framework', 'approach', 'method', 'finding', 'result', 'conclusion', 'evidence', 'data', 'survey', 'experiment']
      const hasAcademicTerms = academicTerms.some(term => sentenceLower.includes(term))
      
      if (hasKeyTerms || hasEconomicTerms || hasAcademicTerms) {
        // Find the position of this sentence in the original text
        const sentenceStart = currentText.indexOf(sentence)
        const sentenceEnd = sentenceStart + sentence.length
        
        // Add text before this sentence
        if (sentenceStart > 0) {
          nodes.push(...renderInlineMathInText(currentText.slice(0, sentenceStart)))
        }
        
        // Add the underlined sentence with math rendering
        const sentenceWithMath = renderInlineMathInText(sentence)
        nodes.push(
          <TooltipProvider key={`citation-${citation.id}-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline underline-offset-4 decoration-dotted cursor-help bg-yellow-50">
                  {sentenceWithMath}
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
    nodes.push(...renderInlineMathInText(currentText))
  }
  
  // If no intelligent citations were found, add some basic highlighting
  if (nodes.length === 0 && citations.length > 0) {
    const sentences = cleanedText.split(/(?<=[.!?])\s+/)
    const highlightedCount = Math.min(3, Math.ceil(sentences.length / 3)) // Highlight about 1/3 of sentences
    
    for (let i = 0; i < highlightedCount; i++) {
      const sentenceIndex = Math.floor((i * sentences.length) / highlightedCount)
      const sentence = sentences[sentenceIndex]
      const citation = citations[i % citations.length]
      
      if (sentence) {
        const sentenceWithMath = renderInlineMathInText(sentence)
        nodes.push(
          <TooltipProvider key={`fallback-citation-${citation.id}-${i}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline underline-offset-4 decoration-dotted cursor-help bg-yellow-50">
                  {sentenceWithMath}
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
      }
    }
  }
  
  return nodes.length > 0 ? nodes : renderInlineMathInText(cleanedText)
}

export function CitedMarkdown({ content, citations }: CitedMarkdownProps) {
  console.log('CitedMarkdown rendering with citations:', citations)
  console.log('CitedMarkdown content length:', content?.length)
  console.log('Citations array:', citations)

  return (
    <div className="prose max-w-none">
      {/* Citation Debug Info */}
      {citations && citations.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Citations Found:</strong> {citations.length} sources available for this content.
          </p>
          <div className="mt-2 text-xs">
            {citations.map((citation, index) => (
              <div key={index}>
                <strong>{citation.id}:</strong> {citation.title} - {citation.url}
              </div>
            ))}
          </div>
        </div>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({children}) => {
            const processed = React.Children.toArray(children).map(child => 
              typeof child === 'string' ? renderInlineMathInText(child) : child
            ).flat()
            return <h1 className="text-3xl font-bold text-[#000000] mb-6 mt-0 border-b-2 border-[#47624f] pb-2">{processed}</h1>
          },
          h2: ({children}) => {
            const processed = React.Children.toArray(children).map(child => 
              typeof child === 'string' ? renderInlineMathInText(child) : child
            ).flat()
            return <h2 className="text-2xl font-semibold text-[#47624f] mb-4 mt-8">{processed}</h2>
          },
          h3: ({children}) => {
            const processed = React.Children.toArray(children).map(child => 
              typeof child === 'string' ? renderInlineMathInText(child) : child
            ).flat()
            return <h3 className="text-xl font-medium text-[#707D7F] mb-3 mt-6">{processed}</h3>
          },
          p: ({ node, children }) => {
            // Check if this paragraph contains only block math
            const flat = React.Children.toArray(children)
            const textContent = flat.filter(child => typeof child === 'string').join('')
            
            // If the paragraph contains block math, render it outside the paragraph
            if (textContent.includes('$$')) {
              const blockMathRegex = /\$\$([^$]+?)\$\$/g
              const matches = Array.from(textContent.matchAll(blockMathRegex))
              
              if (matches.length > 0) {
                return (
                  <>
                    {matches.map((match, index) => (
                      <div key={index} className="my-4 flex justify-center">
                        <BlockMath math={match[1]} />
                      </div>
                    ))}
                  </>
                )
              }
            }
            
            // Otherwise, process normally for inline math and citations
            const processed: React.ReactNode[] = []
            
            console.log('Processing paragraph with citations:', citations?.length || 0)
            
            flat.forEach((child, idx) => {
              if (typeof child === 'string') {
                console.log('Processing text child:', child.substring(0, 50) + '...')
                const transformed = transformTextWithIntelligentCitations(child, citations || [])
                console.log('Transformed result:', transformed.length, 'nodes')
                processed.push(...transformed)
              } else {
                processed.push(child)
              }
            })
            return <p className="text-[#000000] leading-relaxed mb-4 text-base">{processed}</p>
          },
          ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1 text-[#000000]">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-[#000000]">{children}</ol>,
          li: ({children}) => {
            const processed = React.Children.toArray(children).map(child => 
              typeof child === 'string' ? renderInlineMathInText(child) : child
            ).flat()
            return <li className="text-[#000000] leading-relaxed">{processed}</li>
          },
          strong: ({children}) => {
            const processed = React.Children.toArray(children).map(child => 
              typeof child === 'string' ? renderInlineMathInText(child) : child
            ).flat()
            return <strong className="font-semibold text-[#000000]">{processed}</strong>
          },
          em: ({children}) => {
            const processed = React.Children.toArray(children).map(child => 
              typeof child === 'string' ? renderInlineMathInText(child) : child
            ).flat()
            return <em className="italic text-[#707D7F]">{processed}</em>
          },
          blockquote: ({children}) => {
            const processed = React.Children.toArray(children).map(child => 
              typeof child === 'string' ? renderInlineMathInText(child) : child
            ).flat()
            return <blockquote className="border-l-4 border-[#47624f] pl-4 italic text-[#707D7F] mb-4">{processed}</blockquote>
          },
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


