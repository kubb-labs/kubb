import { createReactParser, OperationGenerator as Generator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'

import { Client, Operations } from './components/index.ts'

import type { Operation } from '@kubb/oas'
import type { OperationMethodResult, OperationsByMethod } from '@kubb/plugin-oas'
import type { FileMeta, PluginClient } from './types.ts'

export const clientParser = createReactParser<PluginClient>({
  name: 'plugin-client',
  Operations({ options }) {
    if (!options.templates.operations) {
      return null
    }

    return <Operations.File baseURL={options.baseURL} templates={options.templates.operations} />
  },
  Operation({ options, operation }) {
    const isEnabled = options.client.methods.some((method) => operation.method === method)

    if (!options.templates.client || !isEnabled) {
      return null
    }

    return <Client.File baseURL={options.baseURL} templates={options.templates.client} />
  },
})
