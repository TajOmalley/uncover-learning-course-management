import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'

interface TutorMessageProps {
  content: string
}

export function TutorMessage({ content }: TutorMessageProps) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 {...props} className="text-2xl font-bold text-[#47624f] mb-4 mt-8">
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} className="text-xl font-semibold text-[#47624f] mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} className="text-lg font-semibold text-[#47624f] mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 {...props} className="text-base font-medium text-[#47624f] mb-2 mt-4">
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p {...props} className="mb-4 leading-6 text-gray-700">
              {children}
            </p>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="mb-1 text-gray-700 leading-relaxed">
              {children}
            </li>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className="list-disc list-inside mb-4 space-y-1 pl-4">
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol {...props} className="list-decimal list-inside mb-4 space-y-1 pl-4">
              {children}
            </ol>
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
          code: ({ children, ...props }) => (
            <code {...props} className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre {...props} className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-4 text-sm">
              {children}
            </pre>
          ),
          // Enhanced math styling
          span: ({ children, className, ...props }) => {
            // Check if this is a KaTeX math element
            if (className && className.includes('math')) {
              return (
                <span 
                  {...props} 
                  className={`${className} math-render`}
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    lineHeight: '1.2'
                  }}
                >
                  {children}
                </span>
              )
            }
            return <span {...props} className={className}>{children}</span>
          },
          div: ({ children, className, ...props }) => {
            // Check if this is a KaTeX block math element
            if (className && className.includes('math')) {
              return (
                <div 
                  {...props} 
                  className={`${className} math-block-render`}
                  style={{
                    textAlign: 'center',
                    margin: '1rem 0',
                    overflowX: 'auto'
                  }}
                >
                  {children}
                </div>
              )
            }
            return <div {...props} className={className}>{children}</div>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
