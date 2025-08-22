import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Badge } from '@/components/ui/badge'

interface EmbeddedCitation {
  id: string
  sourceId: string
  sourceTitle: string
  sourceUrl: string
  factId: string
  text: string
  startIndex: number
  endIndex: number
}

interface SourcedContentProps {
  content: string
  citations: EmbeddedCitation[]
  sources: Array<{ id: string; title: string; url: string }>
}

export function SourcedContent({ content, citations, sources }: SourcedContentProps) {
  console.log('SourcedContent rendering with:', {
    contentLength: content?.length,
    citationsCount: citations?.length,
    sourcesCount: sources?.length
  })
  
  console.log('Citations received:', citations)
  console.log('Sources received:', sources)

  // Create a map of source IDs to their display numbers
  const sourceNumberMap = new Map<string, number>()
  sources.forEach((source, index) => {
    sourceNumberMap.set(source.id, index + 1)
  })

  // Function to add citation numbers to content based on citation positions
  const addCitationNumbersToContent = (rawContent: string) => {
    if (!citations || citations.length === 0) {
      return rawContent
    }

    let processedContent = rawContent
    
    // Sort citations by startIndex to process them in order
    const sortedCitations = [...citations].sort((a, b) => a.startIndex - b.startIndex)
    
    // Process citations in reverse order to avoid index shifting
    for (let i = sortedCitations.length - 1; i >= 0; i--) {
      const citation = sortedCitations[i]
      const sourceNumber = sourceNumberMap.get(citation.sourceId)
      
      if (sourceNumber) {
        // Find the end of the sentence containing this citation
        const sentenceEnd = processedContent.indexOf('.', citation.endIndex)
        if (sentenceEnd !== -1) {
          // Insert citation number at the end of the sentence
          const citationNumber = `[${sourceNumber}]`
          processedContent = processedContent.slice(0, sentenceEnd) + citationNumber + processedContent.slice(sentenceEnd)
          console.log(`Added citation ${sourceNumber} at position ${sentenceEnd}`)
        }
      }
    }
    
    return processedContent
  }

  // Function to replace citation numbers with HTML links
  const replaceCitationNumbersWithLinks = (content: string) => {
    if (!citations || citations.length === 0) {
      return content
    }

    let processedContent = content
    
    // Find all citation numbers like [1], [2], [3], etc.
    const citationNumberRegex = /\[(\d+)\]/g
    const matches = processedContent.match(citationNumberRegex)
    
    if (matches) {
      console.log('Found citation numbers in content:', matches)
      
      // Replace each citation number with HTML link
      matches.forEach((match) => {
        const number = parseInt(match.replace(/[\[\]]/g, ''))
        
        // Find the citation that corresponds to this source number
        const citation = citations.find(c => sourceNumberMap.get(c.sourceId) === number)
        
        if (citation) {
          console.log(`Replacing ${match} with citation link for source ${number}`)
          
          // Create HTML citation link
          const citationHtml = `<sup><a href="${citation.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-[#47624f] hover:text-[#707D7F] font-medium hover:underline cursor-pointer" title="View source: ${citation.sourceTitle}">${number}</a></sup>`
          
          // Replace the citation number with HTML
          processedContent = processedContent.replace(match, citationHtml)
        }
      })
    }
    
    return processedContent
  }

  // Process content to add citation numbers and replace them with links
  const contentWithNumbers = addCitationNumbersToContent(content)
  const processedContent = replaceCitationNumbersWithLinks(contentWithNumbers)
  
  // Debug logging
  console.log('Original content length:', content.length)
  console.log('Processed content length:', processedContent.length)
  console.log('Citations count:', citations?.length || 0)

     return (
     <div className="space-y-8">
       {/* Content with Citations */}
               <div className="prose prose-lg max-w-none prose-headings:text-[#47624f] prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-base prose-li:text-gray-700 prose-strong:text-[#47624f] prose-code:text-[#47624f] prose-code:bg-[#C9F2C7] prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
         <ReactMarkdown 
           remarkPlugins={[remarkGfm, remarkMath]}
           rehypePlugins={[rehypeRaw, rehypeKatex]}
           components={{
             // Allow HTML rendering for citation links
             sup: ({ children, ...props }) => <sup {...props}>{children}</sup>,
             a: ({ children, href, ...props }) => (
               <a href={href} {...props} className="text-[#47624f] hover:text-[#707D7F] font-medium hover:underline cursor-pointer">
                 {children}
               </a>
             ),

             p: ({ children, ...props }) => (
               <p {...props} className="mb-6 leading-7 text-gray-700">
                 {children}
               </p>
             ),
                           h1: ({ children, ...props }) => (
                <h1 {...props} className="text-3xl font-bold text-[#47624f] mb-6 mt-8 border-b-2 border-[#B2A29E] pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 {...props} className="text-2xl font-semibold text-[#47624f] mb-4 mt-8">
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 {...props} className="text-xl font-semibold text-[#47624f] mb-3 mt-6">
                  {children}
                </h3>
              ),
              h4: ({ children, ...props }) => (
                <h4 {...props} className="text-lg font-medium text-[#47624f] mb-2 mt-4">
                  {children}
                </h4>
              ),
             li: ({ children, ...props }) => (
               <li {...props} className="mb-2 text-gray-700 leading-relaxed">
                 {children}
               </li>
             ),
             ul: ({ children, ...props }) => (
               <ul {...props} className="list-disc list-inside mb-6 space-y-1 pl-4">
                 {children}
               </ul>
             ),
             ol: ({ children, ...props }) => (
               <ol {...props} className="list-decimal list-inside mb-6 space-y-1 pl-4">
                 {children}
               </ol>
             ),
                           blockquote: ({ children, ...props }) => (
                <blockquote {...props} className="border-l-4 border-[#47624f] pl-4 py-2 my-6 bg-[#C9F2C7] rounded-r-lg italic text-gray-700">
                  {children}
                </blockquote>
              ),
             code: ({ children, ...props }) => (
               <code {...props} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                 {children}
               </code>
             ),
             pre: ({ children, ...props }) => (
               <pre {...props} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
                 {children}
               </pre>
             ),
                           strong: ({ children, ...props }) => (
                <strong {...props} className="font-semibold text-[#47624f]">
                  {children}
                </strong>
              ),
             em: ({ children, ...props }) => (
               <em {...props} className="italic text-gray-700">
                 {children}
               </em>
             ),
           }}
         >
           {processedContent}
         </ReactMarkdown>
       </div>

               {/* Sources Summary - Enhanced styling */}
        {sources && sources.length > 0 && (
          <div className="bg-gradient-to-r from-[#C9F2C7] to-[#E8F5E8] border border-[#B2A29E] rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#47624f] mb-4 flex items-center">
              <span className="bg-[#47624f] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                {sources.length}
              </span>
              Sources & References
            </h3>
            <div className="space-y-3">
              {sources.map((source, index) => (
                <div key={source.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-[#B2A29E] hover:border-[#47624f] transition-colors">
                  <Badge variant="outline" className="bg-[#C9F2C7] text-[#47624f] border-[#B2A29E] font-semibold min-w-[2rem] justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 line-clamp-2">
                      {source.title}
                    </span>
                    <div className="mt-1">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#47624f] hover:text-[#707D7F] text-sm font-medium hover:underline inline-flex items-center"
                      >
                        View Source
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
     </div>
   )
}
