import { createReactGenerator } from '@kubb/plugin-oas'
import { OperationSchema } from './components/OperationSchema.tsx'
import { Operations } from './components/Operations.tsx'
import { Schema } from './components/Schema.tsx'
import type { PluginZod } from './types.ts'

export const zodParser = createReactGenerator<PluginZod>({
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
