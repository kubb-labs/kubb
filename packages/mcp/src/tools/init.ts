import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { availablePlugins, generateConfigFile, KUBB_CONFIG_FILENAME, type PluginOption } from '@internals/shared'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import { initSchema } from '../schemas/initSchema.ts'

export function resolvePlugins(pluginsFlag: string | undefined): PluginOption[] {
  if (!pluginsFlag) {
    return []
  }
  const requested = pluginsFlag
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  return availablePlugins.filter((p) => requested.includes(p.value))
}

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
