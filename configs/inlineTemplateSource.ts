import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Rolldown/tsdown plugin that inline template file content at build time.
 *
 * Any `*.source.ts` entry file that contains a `readFileSync(new URL('...', import.meta.url))` call
 * has its content replaced during the build with:
 *   `export const source = "<inlined file content>"`
 *
 * This avoids a runtime filesystem read — the string is baked directly into `dist/`.
 */
export function inlineTemplateSource() {
  return {
    name: 'inline-template-source',
    transform(code: string, id: string) {
      if (!id.endsWith('.source.ts')) {
        return
      }

      const match = code.match(/new URL\(['"]([^'"`,)]+)['"],\s*import\.meta\.url\)/)
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
