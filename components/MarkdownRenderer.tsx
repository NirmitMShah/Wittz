import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
}


// Preprocess content to fix math expressions
function preprocessMath(content: string): string {
  let processed = content

  // Step 1: Convert \(...\) (escaped LaTeX inline) to $...$ format
  // Use a simple non-greedy match that stops at the first \)
  processed = processed.replace(/\\\((.+?)\\\)/g, (match, mathContent) => {
    return `$${mathContent.trim()}$`
  })
  
  // Step 2: Convert \[...\] to $$...$$ (LaTeX block math format)  
  processed = processed.replace(/\\\[(.+?)\\\]/g, (match, mathContent) => {
    return `$$${mathContent.trim()}$$`
  })

  // Step 3: Convert parenthesized math expressions to $...$ format
  // Matches patterns like (x^2 = -1), (\sqrt{-1}), (2i), etc.
  // Look for parentheses containing math indicators
  const mathPattern = /\(([^()]*(?:\^|_|\\[a-zA-Z]+|[-+*/=<>]|√|π|α|β|γ|θ|λ|μ|σ|∑|∏|∫)[^()]*)\)/g
  
  processed = processed.replace(mathPattern, (match, mathContent, offset) => {
    // Check context before and after to avoid false positives
    const before = processed.substring(Math.max(0, offset - 20), offset)
    const after = processed.substring(offset + match.length, Math.min(processed.length, offset + match.length + 20))
    
    // Skip if already in LaTeX delimiters, code blocks, or markdown links
    if (
      before.includes('$') || after.includes('$') ||
      before.includes('`') || after.includes('`') ||
      before.match(/\[.*\]\(/g)
    ) {
      return match
    }
    
    const cleaned = mathContent.trim()
    
    // Only convert if it looks like math (contains math operators/symbols)
    // and isn't a common text phrase
    const isTextPhrase = /^(like|see|e\.g\.|i\.e\.|for example|as shown|above|below|such as|including)/i.test(cleaned)
    if (cleaned.length > 0 && !isTextPhrase) {
      return `$${cleaned}$`
    }
    
    return match
  })

  return processed
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Process math expressions
  const processedContent = preprocessMath(content)

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ node, ...props }) => {
            return (
              <img
                {...props}
                className={`my-4 rounded-lg border border-[#40414f] max-w-full h-auto ${
                  props.className ?? ''
                }`}
                onError={(e) => {
                  // Fallback for broken images
                  const target = e.currentTarget
                  target.style.display = 'none'
                }}
              />
            )
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
