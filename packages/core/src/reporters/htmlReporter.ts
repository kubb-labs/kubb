import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openInBrowser, read, writeRaw } from '@internals/utils'
import { createReporter, type GenerationResult } from '../createReporter.ts'
import { buildReport, reportTarget } from './report.ts'

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
    const { dir, name } = reportTarget(result.config)
    const assets = new URL('./html/', import.meta.url)
    const [html, ui] = await Promise.all([read(fileURLToPath(new URL('index.html', assets))), read(fileURLToPath(new URL('ui.iife.js', assets)))])

    await Promise.all([
      writeRaw(join(dir, name, 'index.html'), html),
      writeRaw(join(dir, name, 'ui.iife.js'), ui),
      writeRaw(join(dir, name, 'data.js'), serializeReport(result)),
    ])
    const reportPath = join(dir, name, 'index.html')
    console.error(`HTML report written to ${relative(process.cwd(), reportPath)}`)
    openInBrowser(reportPath)
  },
})
