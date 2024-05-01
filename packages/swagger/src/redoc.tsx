import fs from 'node:fs'
import path from 'node:path'
import type { OasTypes } from '@kubb/oas'
import pkg from 'handlebars'
import { renderToString } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'
import redoc from 'redoc'

type BuildDocsOptions = {
  title?: string
  disableGoogleFont?: boolean
  templateOptions?: any
  redocOptions?: any
}

// see http://www.thespanner.co.uk/2011/07/25/the-json-specification-is-now-wrong/
function escapeClosingScriptTag(str: string): string {
  return str.replace(/<\/script>/g, '<\\/script>')
}

// see http://www.thespanner.co.uk/2011/07/25/the-json-specification-is-now-wrong/
function escapeUnicode(str: string): string {
  // biome-ignore lint/style/useTemplate: <explanation>
  return str.replace(/\u2028|\u2029/g, (m) => '\\u202' + (m === '\u2028' ? '8' : '9'))
}

function sanitizeJSONString(str: string): string {
  return escapeClosingScriptTag(escapeUnicode(str))
}

export async function getPageHTML(api: OasTypes.OASDocument, { title, disableGoogleFont, templateOptions, redocOptions = {} }: BuildDocsOptions = {}) {
  const apiUrl = redocOptions.specUrl
  const { Redoc, createStore } = redoc || require('redoc')
  const store = await createStore(api, apiUrl, redocOptions)
  const sheet = new ServerStyleSheet()

  const error = console.error
  console.error = (...args: any) => {
    if (/defaultProps/.test(args[0])) return
    error(...args)
  }

  const html = renderToString(sheet.collectStyles(<Redoc store={store} />))
  const state = await store.toJS()
  const css = sheet.getStyleTags()

  const templateFileName = path.join(__dirname, '../static/redoc.hbs')
  const template = pkg.compile(fs.readFileSync(templateFileName).toString())
  return template({
    redocHTML: `
      <div id="redoc">${html || ''}</div>
      <script>
      ${`const __redoc_state = ${sanitizeJSONString(JSON.stringify(state))};` || ''}

      var container = document.getElementById('redoc');
      Redoc.${'hydrate(__redoc_state, container)'};

      </script>`,
    redocHead:
      // biome-ignore lint/style/useTemplate: <explanation>
      `<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>` + css,
    title: title || api.info.title || 'ReDoc documentation',
    disableGoogleFont,
    templateOptions,
  })
}
