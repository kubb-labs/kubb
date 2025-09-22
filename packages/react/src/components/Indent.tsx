import dedent from 'dedent'
import indentString from 'indent-string'
import React from 'react'

type IndentProps = {
  size?: number
  children?: React.ReactNode
}

/**
 * Indents all children by `size` spaces.
 * Collapses consecutive <br /> tags to at most 2.
 */
export function Indent({ size = 2, children }: IndentProps) {
  if (!children) return null

  const filtered = React.Children.toArray(children).filter(Boolean)
  const result: React.ReactNode[] = []

  let prevWasBr = false
  let brCount = 0

  filtered.forEach((child) => {
    if (React.isValidElement(child) && child.type === 'br') {
      if (!prevWasBr || brCount < 2) {
        result.push(child)
        brCount++
      }
      prevWasBr = true
    } else {
      prevWasBr = false
      brCount = 0
      result.push(child)
    }
  })

  return (
    <>
      {result.map((child) => {
        if (typeof child === 'string') {
          const cleaned = dedent(child)
          return <>{indentString(cleaned, size)}</>
        }
        return (
          <>
            {' '.repeat(size)}
            {child}
          </>
        )
      })}
    </>
  )
}
