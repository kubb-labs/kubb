import { useColorModeValue } from '@chakra-ui/react'

import type { editor } from 'monaco-editor'

export const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  fontFamily: '"Cascadia Code", "Jetbrains Mono", "Fira Code", "Menlo", "Consolas", monospace',
  fontLigatures: true,
  fontSize: 14,
  lineHeight: 24,
  minimap: { enabled: false },
  tabSize: 2,
}

export function useMonacoThemeValue() {
  return useColorModeValue('light', 'vs-dark')
}

export function useBorderColor() {
  return useColorModeValue('gray.400', 'gray.600')
}

export function useBgColor() {
  return useColorModeValue('white', 'gray.700')
}
