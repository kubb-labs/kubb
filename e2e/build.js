import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

const jiraSpecUrl = 'https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json'

const result = await build({
  config: {
    root: '.',
    input: { path: jiraSpecUrl },
    output: { path: './out', clean: true, write: false },
    plugins: [
      pluginOas({ validate: false }),
      // IMPORTANT: leaving plugin-ts generators at defaults triggers the crash.
      pluginTs({ output: { path: './types', barrelType: false } }),
    ],
  },
})

console.log('build resolved:', {
  files: Array.isArray(result.files) ? result.files.length : null,
  hasError: Boolean(result.error),
  failedPlugins: result.failedPlugins ?? null,
})
