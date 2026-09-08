import { resolve } from 'node:path'
import { write } from '@internals/utils'
import type { Reporter, ReporterContext } from '../createReporter.ts'
import { createReporter } from '../createReporter.ts'
import { createHtmlReportCollector, type HtmlReportSnapshot } from './htmlReportCollector.ts'
import { loadHtmlReportAssets, type HtmlReportAssets } from './htmlReportAssets.ts'
import type { Hookable } from '../Hookable.ts'
import type { KubbHooks } from '../types.ts'
import type { InputNode } from '@kubb/ast'

export type CreateHtmlReporterOptions = {
  hooks: Hookable<KubbHooks>
  getInputNode: () => InputNode | null | undefined
  assets?: HtmlReportAssets | (() => Promise<HtmlReportAssets>)
  now?: () => number
}

function escapeScriptContent(value: string): string {
  return value.replaceAll(/<\/script/gi, '<\\/script')
}

function escapeStyleContent(value: string): string {
  return value.replaceAll(/<\/style/gi, '<\\/style')
}

function serializeReport(snapshot: HtmlReportSnapshot): string {
  return JSON.stringify(snapshot)
    .replaceAll('<', '\\u003C')
    .replaceAll('>', '\\u003E')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}

function createDocument(snapshot: HtmlReportSnapshot, assets: HtmlReportAssets): string {
  const data = serializeReport(snapshot)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kubb report</title>
    <style>${escapeStyleContent(assets.style)}</style>
  </head>
  <body>
    <script type="application/json" id="kubb-report-data">${data}</script>
    <div id="app"></div>
    <script type="module">${escapeScriptContent(assets.script)}</script>
  </body>
</html>
`
}

async function resolveAssets(assets: CreateHtmlReporterOptions['assets']): Promise<HtmlReportAssets> {
  if (!assets) return loadHtmlReportAssets()
  return typeof assets === 'function' ? assets() : assets
}

/**
 * Creates the file reporter used by `kubb generate --reporter html`. The collector is installed
 * immediately, while the document is deferred until the lifecycle drain has a complete snapshot.
 */
export function createHtmlReporter({ hooks, getInputNode, assets, now = Date.now }: CreateHtmlReporterOptions): Reporter {
  const collector = createHtmlReportCollector({ hooks, getInputNode })
  let lastTimestamp = -1

  const reporter = createReporter<HtmlReportSnapshot>({
    name: 'html',
    report() {
      return collector.getSnapshot()
    },
    async drain(_context: ReporterContext, reports) {
      if (reports.length === 0) return

      const resolvedAssets = await resolveAssets(assets)
      for (const snapshot of reports) {
        // Configs share one lifecycle, so each completed snapshot needs its own file.
        const timestamp = Math.max(now(), lastTimestamp + 1)
        lastTimestamp = timestamp
        const html = createDocument(snapshot, resolvedAssets)
        const path = resolve(process.cwd(), '.kubb', `kubb-report-${timestamp}.html`)
        await write(path, html)
      }
    },
  })

  return {
    ...reporter,
    [Symbol.dispose]() {
      collector.dispose()
      reporter[Symbol.dispose]()
    },
  }
}
