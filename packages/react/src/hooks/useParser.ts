import { useContext } from 'react'

import { Parser } from '../components/Parser.tsx'

import type { ParserContextProps } from '../components/Parser.tsx'

/**
 * `useEditor` will return the current language set by the parent `Editor` component.
 * @deprecated use `useParser` instead
 */
export function useEditor(): ParserContextProps {
  return useContext(Parser.Context)
}

export function useParser(): ParserContextProps {
  return useContext(Parser.Context)
}
