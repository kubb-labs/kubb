import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateConfigFile, KUBB_CONFIG_FILENAME } from '@internals/shared'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'

const initSchema = v.object({
  input: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Path to OpenAPI spec (default: ./openapi.yaml)'))),
  output: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Output directory (default: ./src/gen)'))),
})

export const initTool = defineTool(
  {
    name: 'init',
    description:
      'Scaffold a kubb.config.ts in the current directory (non-interactive). Does not install packages or add plugins: run `kubb add <id> --yes` for each plugin afterwards.',
    schema: initSchema,
  },
  async ({ input = './openapi.yaml', output = './src/gen' }) => {
    const dest = path.join(process.cwd(), KUBB_CONFIG_FILENAME)
    if (fs.existsSync(dest)) {
      return tool.error(`${KUBB_CONFIG_FILENAME} already exists at ${dest}. Delete it first before running init again.`)
    }
    fs.writeFileSync(dest, generateConfigFile({ inputPath: input, outputPath: output }), 'utf-8')
    return tool.text(
      `Created ${KUBB_CONFIG_FILENAME}\n\nInstall Kubb:\n  npm install kubb\n\nAdd each plugin with its registry id, which installs it and adds it to the config:\n  npx kubb add plugin-ts --yes\n\nThen run:\n  npx kubb generate`,
    )
  },
)
