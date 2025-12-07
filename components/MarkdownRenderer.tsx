import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
}


// Helper function to check if text around a position is inside math delimiters
function isInsideMathDelimiters(content: string, startPos: number, endPos: number): boolean {
  // Look backwards from start to find opening delimiter
  const before = content.substring(0, startPos)
  const after = content.substring(endPos)
  
  // Find the last $ before start position
  const lastDollarIndex = before.lastIndexOf('$')
  if (lastDollarIndex === -1) return false
  
  // Check if it's part of block math ($$)
  const isBlockMath = lastDollarIndex > 0 && before[lastDollarIndex - 1] === '$'
  
  if (isBlockMath) {
    // Check if there's a closing $$ after end position
    const closingIndex = after.indexOf('$$')
    return closingIndex !== -1
  } else {
    // Check if there's a closing $ after end position (not part of $$)
    const closingIndex = after.indexOf('$')
    if (closingIndex === -1) return false
    // Make sure the closing $ is not part of $$
    return closingIndex === 0 || after[closingIndex - 1] !== '$'
  }
}

// Preprocess content to fix math expressions
function preprocessMath(content: string): string {
  // First, protect image markdown to prevent processing math inside URLs
  const imagePlaceholders: Array<{ placeholder: string; original: string }> = []
  let processed = content
  let placeholderIndex = 0

  // Protect image markdown (![alt](url)) first - must be before code blocks
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match) => {
    const placeholder = `__IMAGE_${placeholderIndex}__`
    imagePlaceholders.push({ placeholder, original: match })
    placeholderIndex++
    return placeholder
  })

  // Then protect code blocks (both inline and block) to prevent processing math inside them
  const codePlaceholders: Array<{ placeholder: string; original: string }> = []

  // Protect code blocks (```...```) first
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${placeholderIndex}__`
    codePlaceholders.push({ placeholder, original: match })
    placeholderIndex++
    return placeholder
  })

  // Protect inline code (`...`) - but not if it's part of a code block
  const inlineCodeRegex = /`[^`\n]+?`/g
  const inlineCodeMatches: Array<{ match: string; index: number }> = []
  let inlineCodeMatch
  const tempForCode = processed
  while ((inlineCodeMatch = inlineCodeRegex.exec(tempForCode)) !== null) {
    inlineCodeMatches.push({
      match: inlineCodeMatch[0],
      index: inlineCodeMatch.index
    })
  }

  // Replace inline code in reverse order
  for (let i = inlineCodeMatches.length - 1; i >= 0; i--) {
    const { match, index } = inlineCodeMatches[i]
    const placeholder = `__CODE_INLINE_${placeholderIndex}__`
    codePlaceholders.push({ placeholder, original: match })
    processed = processed.substring(0, index) + placeholder + processed.substring(index + match.length)
    placeholderIndex++
  }

  // Now protect existing math expressions by temporarily replacing them
  const mathPlaceholders: Array<{ placeholder: string; original: string }> = []

  // Protect block math ($$...$$) first
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match) => {
    const placeholder = `__MATH_BLOCK_${placeholderIndex}__`
    mathPlaceholders.push({ placeholder, original: match })
    placeholderIndex++
    return placeholder
  })

  // Protect inline math ($...$) - be careful not to match block math
  // Match $...$ but ensure it's not part of $$...$$
  const inlineMathRegex = /\$([^$\n]+?)\$/g
  const inlineMatches: Array<{ match: string; index: number }> = []
  let inlineMatch
  const tempProcessed = processed
  while ((inlineMatch = inlineMathRegex.exec(tempProcessed)) !== null) {
    // Double-check it's not part of block math by checking surrounding chars
    const beforeChar = inlineMatch.index > 0 ? tempProcessed[inlineMatch.index - 1] : ''
    const afterEnd = inlineMatch.index + inlineMatch[0].length
    const afterChar = afterEnd < tempProcessed.length ? tempProcessed[afterEnd] : ''
    
    // Skip if it's part of block math (has $ before or after)
    if (beforeChar !== '$' && afterChar !== '$') {
      inlineMatches.push({
        match: inlineMatch[0],
        index: inlineMatch.index
      })
    }
  }

  // Replace inline math in reverse order
  for (let i = inlineMatches.length - 1; i >= 0; i--) {
    const { match, index } = inlineMatches[i]
    const placeholder = `__MATH_INLINE_${placeholderIndex}__`
    mathPlaceholders.push({ placeholder, original: match })
    processed = processed.substring(0, index) + placeholder + processed.substring(index + match.length)
    placeholderIndex++
  }

  // Step 1: Convert \(...\) (escaped LaTeX inline) to $...$ format
  processed = processed.replace(/\\\((.+?)\\\)/g, (match, mathContent) => {
    return `$${mathContent.trim()}$`
  })
  
  // Step 2: Convert \[...\] to $$...$$ (LaTeX block math format)  
  processed = processed.replace(/\\\[(.+?)\\\]/g, (match, mathContent) => {
    return `$$${mathContent.trim()}$$`
  })

  // Step 3: Convert parenthesized math expressions to $...$ format
  // But ONLY if they're not already inside $...$ or $$...$$ delimiters
  const mathPattern = /\(([^()]*(?:\^|_|\\[a-zA-Z]+|[-+*/=<>]|√|π|α|β|γ|θ|λ|μ|σ|∑|∏|∫)[^()]*)\)/g
  
  // Collect all matches first
  const matches: Array<{ match: string; mathContent: string; offset: number }> = []
  let match
  while ((match = mathPattern.exec(processed)) !== null) {
    matches.push({
      match: match[0],
      mathContent: match[1],
      offset: match.index
    })
  }
  
  // Process matches in reverse order to avoid offset shifting
  for (let i = matches.length - 1; i >= 0; i--) {
    const { match: fullMatch, mathContent, offset } = matches[i]
    
    // Skip if already inside math delimiters
    if (isInsideMathDelimiters(processed, offset, offset + fullMatch.length)) {
      continue
    }
    
    // Check if inside code blocks or markdown links
    const before = processed.substring(Math.max(0, offset - 50), offset)
    const after = processed.substring(offset + fullMatch.length, Math.min(processed.length, offset + fullMatch.length + 50))
    
    // Skip if inside code blocks
    const codeBlockCount = (before.match(/`/g) || []).length
    if (codeBlockCount % 2 === 1 && after.includes('`')) {
      continue
    }
    
    // Skip if inside markdown links
    if (before.match(/\[.*\]\([^)]*$/)) {
      continue
    }
    
    const cleaned = mathContent.trim()
    
    // Only convert if it looks like math and isn't a common text phrase
    const isTextPhrase = /^(like|see|e\.g\.|i\.e\.|for example|as shown|above|below|such as|including)/i.test(cleaned)
    if (cleaned.length > 0 && !isTextPhrase) {
      processed = processed.substring(0, offset) + `$${cleaned}$` + processed.substring(offset + fullMatch.length)
    }
  }

  // Restore protected math expressions in reverse order
  for (let i = mathPlaceholders.length - 1; i >= 0; i--) {
    const { placeholder, original } = mathPlaceholders[i]
    processed = processed.replace(placeholder, original)
  }

  // Restore protected code blocks in reverse order
  for (let i = codePlaceholders.length - 1; i >= 0; i--) {
    const { placeholder, original } = codePlaceholders[i]
    processed = processed.replace(placeholder, original)
  }

  // Restore protected image markdown in reverse order (after code blocks)
  for (let i = imagePlaceholders.length - 1; i >= 0; i--) {
    const { placeholder, original } = imagePlaceholders[i]
    processed = processed.replace(placeholder, original)
  }

  return processed
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Process math expressions
  const processedContent = preprocessMath(content)

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          [remarkMath, { singleDollarTextMath: true }]
        ]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ node, ...props }) => {
            return (
              <img
                {...props}
                className={`my-6 rounded-xl border-2 border-gray-200 shadow-md max-w-full h-auto ${
                  props.className ?? ''
                }`}
                alt={props.alt || 'Educational diagram'}
                loading="lazy"
                onError={(e) => {
                  // Fallback for broken images - hide the image element
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
