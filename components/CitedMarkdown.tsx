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

// Splits text and wraps citation markers {{text}}[S#] into a span with tooltip
function transformTextWithCitations(text: string, citationMap: Map<string, CitationItem>) {
  const nodes: React.ReactNode[] = []
  const regex = /\{\{([^}]+)\}\}\[(S\d+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const [full, innerText, sourceId] = match
    const start = match.index
    const end = start + full.length

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start))
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

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
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
          p: ({ node, children }) => {
            // Post-process text nodes inside paragraphs
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


