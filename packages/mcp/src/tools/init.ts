import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateConfigFile, KUBB_CONFIG_FILENAME, resolvePlugins } from '@internals/shared'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'

const initSchema = v.object({
  input: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Path to OpenAPI spec (default: ./openapi.yaml)'))),
  output: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Output directory (default: ./src/gen)'))),
  plugins: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Comma-separated list of plugins: plugin-ts,plugin-zod,...'))),
})

export const initTool = defineTool(
  {
    name: 'init',
    description: 'Scaffold a kubb.config.ts in the current directory (non-interactive). Does not install packages.',
    schema: initSchema,
  },
  async ({ input = './openapi.yaml', output = './src/gen', plugins }) => {
    const selected = resolvePlugins(plugins)
    const content = generateConfigFile({ selectedPlugins: selected, inputPath: input, outputPath: output })
    const dest = path.join(process.cwd(), KUBB_CONFIG_FILENAME)
    if (fs.existsSync(dest)) {
      return tool.error(`${KUBB_CONFIG_FILENAME} already exists at ${dest}. Delete it first before running init again.`)
    }
    fs.writeFileSync(dest, content, 'utf-8')
    const packageList = ['kubb', ...selected.map((p) => p.packageName)].join(' ')
    return tool.text(`Created kubb.config.ts\n\nInstall packages:\n  npm install ${packageList}\n\nThen run:\n  npx kubb generate`)
  },
)
