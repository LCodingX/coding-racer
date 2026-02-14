'use client'

import { useEffect, useRef } from 'react'

interface CodeDisplayProps {
  targetCode: string
  typedText: string
  currentIndex: number
  errorIndex: number | null
}

export default function CodeDisplay({ targetCode, typedText, currentIndex, errorIndex }: CodeDisplayProps) {
  const caretRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (caretRef.current) {
      caretRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentIndex])

  return (
    <pre className="font-mono text-sm leading-relaxed p-6 bg-gray-50 rounded-xl border border-gray-200 overflow-auto whitespace-pre-wrap break-all">
      {targetCode.split('').map((char, i) => {
        const isCurrent = i === currentIndex
        const isTyped = i < typedText.length
        const inErrorZone = errorIndex !== null && i >= errorIndex && isTyped

        let style: React.CSSProperties = { color: '#9ca3af' }
        if (isTyped) {
          if (inErrorZone) {
            style = { backgroundColor: '#fca5a5', color: '#991b1b', borderRadius: '2px' }
          } else {
            style = { backgroundColor: '#86efac', color: '#166534', borderRadius: '2px' }
          }
        }

        if (isCurrent) {
          style = { ...style, position: 'relative' as const }
        }

        const displayChar = char === '\n' ? '↵\n' : char === '\t' ? '→   ' : char

        return (
          <span key={i} style={style}>
            {isCurrent && (
              <span
                ref={caretRef}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '1.5px',
                  height: '100%',
                  backgroundColor: 'black',
                  pointerEvents: 'none',
                }}
              />
            )}
            {displayChar}
          </span>
        )
      })}
    </pre>
  )
}
