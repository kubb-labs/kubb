import { safeBuild } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

const result = await safeBuild({
  config: {
    root: '.',
    input: { path: './schemas/petStore.yaml' },
    output: { path: './out', clean: true, write: false },
    plugins: [pluginOas({ validate: false }), pluginTs({ output: { path: './types', barrelType: false } })],
  },
})

console.log('build resolved:', {
  files: Array.isArray(result.files) ? result.files.length : null,
  error: Boolean(result.error),
  failedPlugins: result.failedPlugins ?? null,
})
