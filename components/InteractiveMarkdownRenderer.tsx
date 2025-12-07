'use client'

import { useMemo } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import InteractiveHTMLBlock from './InteractiveHTMLBlock'

interface InteractiveBlock {
  id: string
  description: string
  position: number // Character position in content where to insert
}

interface ContentPart {
  type: 'markdown' | 'interactive'
  content?: string
  interactive?: InteractiveBlock
  position: number
}

interface InteractiveMarkdownRendererProps {
  content: string
}

export default function InteractiveMarkdownRenderer({
  content,
}: InteractiveMarkdownRendererProps) {

  // Parse content to extract interactive blocks
  const interactiveBlocks = useMemo(() => {
    const blocks: InteractiveBlock[] = []
    const interactiveRegex = /\[INTERACTIVE:\s*([^\]]+)\]/g
    let match
    let idCounter = 0

    while ((match = interactiveRegex.exec(content)) !== null) {
      blocks.push({
        id: `interactive-${idCounter++}`,
        description: match[1].trim(),
        position: match.index,
      })
    }

    return blocks.sort((a, b) => a.position - b.position)
  }, [content])

  // Render content with interactive blocks inserted at their positions
  const renderedContent = useMemo(() => {
    // If no blocks, just render the content (but remove interactive markers)
    if (interactiveBlocks.length === 0) {
      const cleanedContent = content.replace(/\[INTERACTIVE:\s*[^\]]+\]/g, '')
      return <MarkdownRenderer content={cleanedContent} />
    }

    // Split content and insert blocks
    const parts: Array<ContentPart & { content?: string }> = []
    let lastIndex = 0

    interactiveBlocks.forEach((block) => {
      // Add content before this block
      if (block.position > lastIndex) {
        let contentBefore = content.substring(lastIndex, block.position)
        // Remove any interactive markers that might be in this content
        contentBefore = contentBefore.replace(/\[INTERACTIVE:\s*[^\]]+\]/g, '')
        if (contentBefore.trim()) {
          parts.push({
            type: 'markdown',
            content: contentBefore,
            position: lastIndex,
          })
        }
      }

      // Add the interactive block
      parts.push({
        type: 'interactive',
        interactive: block,
        position: block.position,
      })

      // Update lastIndex - skip the marker text
      const markerMatch = content.substring(block.position).match(/\[INTERACTIVE:\s*[^\]]+\]/)
      if (markerMatch) {
        lastIndex = block.position + markerMatch[0].length
      } else {
        lastIndex = block.position
      }
    })

    // Add remaining content
    if (lastIndex < content.length) {
      let remainingContent = content.substring(lastIndex)
      // Remove any interactive markers that might be in remaining content
      remainingContent = remainingContent.replace(/\[INTERACTIVE:\s*[^\]]+\]/g, '')
      if (remainingContent.trim()) {
        parts.push({
          type: 'markdown',
          content: remainingContent,
          position: lastIndex,
        })
      }
    }

    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'markdown' && part.content) {
            return <MarkdownRenderer key={`content-${index}`} content={part.content} />
          } else if (part.type === 'interactive' && part.interactive) {
            return (
              <InteractiveHTMLBlock
                key={part.interactive.id}
                description={part.interactive.description}
              />
            )
          }
          return null
        })}
      </>
    )
  }, [content, interactiveBlocks])

  return (
    <div className="relative">
      {renderedContent}
    </div>
  )
}
