import { File, useApp } from '@kubb/react'

import type { PluginZodios } from '../types.ts'
import { createParser } from '@kubb/plugin-oas'
import { Definitions } from '../components/Definitions.tsx'
import { getDefinitions, getDefinitionsImports } from '../components/utils.ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { URLPath } from '@kubb/core/utils'
import transformers from '@kubb/core/transformers'

export const definitionsParser = createParser<PluginZodios>({
  name: 'definitions',
  pluginName: 'plugin-zodios',
  templates: {
    Operations({ options, operationsByMethod, operations }) {
      const { pluginManager } = useApp<PluginZodios>()

      const file = pluginManager.getFile({ name: options.name, extName: '.ts', pluginKey: ['plugin-zodios'] })

      const definitionsImports = getDefinitionsImports(operationsByMethod, {
        resolveName: pluginManager.resolveName,
        resolvePath: pluginManager.resolvePath,
        pluginKey: [pluginZodName],
      })

      const imports = definitionsImports
        .map(({ name, path }, index) => {
          if (!path) {
            return null
          }

          return <File.Import extName={options.extName} key={index} name={[name]} root={file.path} path={path} />
        })
        .filter(Boolean)

      const definitions = getDefinitions(operationsByMethod, {
        resolveName: pluginManager.resolveName,
        pluginKey: [pluginZodName],
      }).map(({ errors, response, operation, parameters }) => {
        const template = `
    {
      method: "${operation.method}",
      path: "${new URLPath(operation.path).URL}",
      ${options.includeOperationIdAsAlias ? `alias: "${operation.getOperationId()}",\n` : ''}
      description: \`${transformers.escape(operation.getDescription())}\`,
      requestFormat: "json",
      parameters: [
          ${parameters.join(',')}
      ],
      response: ${response},
      errors: [
          ${errors.join(',')}
      ],
    }
    `
        // remove empty lines from conditional property rendering
        return template.replace(/^\s*[\r\n]/gm, '').trim()
      })

      return (
        <File baseName={file.baseName} path={file.path} meta={file.meta} exportable={false}>
          <File.Import name={['makeApi', 'Zodios']} path="@zodios/core" />
          {imports}
          <File.Source>
            <Definitions name={'api'} baseURL={options.baseURL} definitions={definitions} />
          </File.Source>
        </File>
      )
    },
  },
})
