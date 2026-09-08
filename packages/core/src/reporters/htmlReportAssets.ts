import { readFile } from 'node:fs/promises'

export type HtmlReportAssets = {
  script: string
  style: string
}

/**
 * Reads the browser assets copied into the published core bundle during the package build.
 * Keeping this boundary file-based lets core ship the reporter without importing the private
 * devtools package at runtime.
 */
export async function loadHtmlReportAssets(): Promise<HtmlReportAssets> {
  const [script, style] = await Promise.all([
    readFile(new URL('./assets/report.js', import.meta.url), 'utf8'),
    readFile(new URL('./assets/report.css', import.meta.url), 'utf8'),
  ])

  return { script, style }
}
