import fs from 'node:fs'
import path from 'node:path'
import type { OasTypes } from '@kubb/oas'
import pkg from 'handlebars'

type BuildDocsOptions = {
  title?: string
  disableGoogleFont?: boolean
  templateOptions?: any
}

export async function getPageHTML(api: OasTypes.OASDocument, { title, disableGoogleFont, templateOptions }: BuildDocsOptions = {}) {
  const templateFileName = path.join(__dirname, '../static/redoc.hbs')
  const template = pkg.compile(fs.readFileSync(templateFileName).toString())
  return template({
    title: title || api.info.title || 'ReDoc documentation',
    redocHTML: `
     <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
 <div id="redoc-container"></div>
 <script>
   const data = ${JSON.stringify(api, null, 2)};
   Redoc.init(data, {
     "expandResponses": "200,400"
   }, document.getElementById('redoc-container'))
 </script>
    `,
    disableGoogleFont,
    templateOptions,
  })
}
