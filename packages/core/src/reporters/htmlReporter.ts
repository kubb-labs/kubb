import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openInBrowser, read } from '@internals/utils'
import { createReporter, type GenerationResult } from '../createReporter.ts'
import { kubbStorage, resolveKubbDir } from '../storages/kubbStorage.ts'
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
    const dir = resolveKubbDir(resolve(process.cwd(), '.kubb'))
    const storage = kubbStorage({ base: dir })
    const assets = new URL('./html/', import.meta.url)
    const [html, ui] = await Promise.all([read(fileURLToPath(new URL('index.html', assets))), read(fileURLToPath(new URL('ui.iife.js', assets)))])

    await Promise.all([
      storage.setItem(`${baseName}/index.html`, html),
      storage.setItem(`${baseName}/ui.iife.js`, ui),
      storage.setItem(`${baseName}/data.js`, serializeReport(result)),
    ])
    const reportPath = join(dir, baseName, 'index.html')
    console.error(`HTML report written to ${relative(process.cwd(), reportPath)}`)
    openInBrowser(reportPath)
  },
})
