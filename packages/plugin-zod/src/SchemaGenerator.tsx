import { createReactParser } from '@kubb/plugin-oas'
import { Schema } from './components/Schema.tsx'
import type { PluginZod } from './types.ts'
import { Operations } from './components/Operations.tsx'
import { OperationSchema } from './components/OperationSchema.tsx'

export const zodParser = createReactParser<PluginZod>({
  name: 'plugin-zod',
  Operations({ options }) {
    if (!options.templates.operations) {
      return null
    }

    return <Operations.File templates={options.templates.operations} />
  },
  Operation() {
    return <OperationSchema.File />
  },
  Schema({ schema, name }) {
    return <Schema.File />
  },
})
