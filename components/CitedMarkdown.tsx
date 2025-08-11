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
  // Fix common concatenation patterns
  return text
    // Fix concatenated words like "crucialThe", "vitalYC", etc.
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Fix double spaces
    .replace(/\s+/g, ' ')
    // Fix spacing around citations
    .replace(/\s*\{\{/g, ' {{')
    .replace(/\}\}\s*/g, '}} ')
    // Clean up any remaining concatenated text
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    .trim()
}

// Splits text and wraps citation markers {{text}}[S#] into a span with tooltip
function transformTextWithCitations(text: string, citationMap: Map<string, CitationItem>) {
  // Clean up the text first
  const cleanedText = cleanConcatenatedText(text)
  
  const nodes: React.ReactNode[] = []
  const regex = /\{\{([^}]+)\}\}\[(S\d+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(cleanedText)) !== null) {
    const [full, innerText, sourceId] = match
    const start = match.index
    const end = start + full.length

    if (start > lastIndex) {
      nodes.push(cleanedText.slice(lastIndex, start))
    }

    const citation = citationMap.get(sourceId)
    if (citation) {
      nodes.push(
        <TooltipProvider key={`${start}-${sourceId}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="underline underline-offset-4 decoration-dotted cursor-help">{innerText}</span>
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
    } else {
      nodes.push(innerText)
    }
    lastIndex = end
  }

  if (lastIndex < cleanedText.length) {
    nodes.push(cleanedText.slice(lastIndex))
  }

  return nodes
}

export function CitedMarkdown({ content, citations }: CitedMarkdownProps) {
  const citationMap = React.useMemo(() => {
    const map = new Map<string, CitationItem>()
    for (const c of citations || []) {
      map.set(c.id, c)
    }
    return map
  }, [citations])

  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({children}) => <h1 className="text-3xl font-bold text-[#000000] mb-6 mt-0 border-b-2 border-[#47624f] pb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-2xl font-semibold text-[#47624f] mb-4 mt-8">{children}</h2>,
          h3: ({children}) => <h3 className="text-xl font-medium text-[#707D7F] mb-3 mt-6">{children}</h3>,
          p: ({ node, children }) => {
            // Post-process text nodes inside paragraphs for citations
            const flat = React.Children.toArray(children)
            const processed: React.ReactNode[] = []
            flat.forEach((child, idx) => {
              if (typeof child === 'string') {
                processed.push(...transformTextWithCitations(child, citationMap))
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


