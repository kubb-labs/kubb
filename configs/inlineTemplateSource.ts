import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Rolldown/tsdown plugin that uses import attributes to replace import with text with the real source
 */
export function inlineTemplateSource() {
  return {
    name: 'inline-template-source',
    transform(code: string, id: string) {
      if (!id.endsWith('.source.ts')) {
        return
      }

      const match = code.match(/import\s+\w+\s+from\s+['"]([^'"]+)['"]\s+with\s+\{\s*type:\s*['"]text['"]\s*\}/)
      if (!match) {
        return
      }

      const templatePath = path.resolve(path.dirname(id), match[1]!)

      let content: string
      try {
        content = readFileSync(templatePath, 'utf-8')
      } catch (err) {
        throw new Error(`[inline-template-source] Could not read template file: ${templatePath}`, { cause: err })
      }

      return `export const source = ${JSON.stringify(content)}`
    },
  }
}
