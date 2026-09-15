import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openInBrowser, read, write } from '@internals/utils'
import { createReporter, type GenerationResult } from '../createReporter.ts'
import { buildReport } from './report.ts'

function serializeReport(result: GenerationResult): string {
  const data = JSON.stringify({ generatedAt: new Date().toISOString(), report: buildReport(result), pluginFiles: result.pluginFiles ?? [] })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
  return `globalThis.__KUBB_REPORT__ = ${data}\n`
}

/**
 * Writes a static HTML report directory selected with `--reporter html`.
 */
export const htmlReporter = createReporter({
  name: 'html',
  needsPluginFiles: true,
  async report(result) {
    const name = result.config.name?.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
    const baseName = ['kubb', name, Date.now()].filter(Boolean).join('-')
    const pathName = resolve(process.cwd(), '.kubb', baseName)
    const assets = new URL('./html/', import.meta.url)
    const [html, ui] = await Promise.all([read(fileURLToPath(new URL('index.html', assets))), read(fileURLToPath(new URL('ui.iife.js', assets)))])

    await Promise.all([
      write(resolve(pathName, 'index.html'), html),
      write(resolve(pathName, 'ui.iife.js'), ui),
      write(resolve(pathName, 'data.js'), serializeReport(result)),
    ])
    const reportPath = resolve(pathName, 'index.html')
    console.error(`HTML report written to ${relative(process.cwd(), reportPath)}`)
    openInBrowser(reportPath)
  },
})
