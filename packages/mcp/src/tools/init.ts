import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { availablePlugins, generateConfigFile, KUBB_CONFIG_FILENAME, type PluginOption } from '@internals/shared'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import { initSchema } from '../schemas/initSchema.ts'

function resolvePlugins(pluginsFlag: string | undefined): PluginOption[] {
  if (!pluginsFlag) {
    return availablePlugins.filter((p) => p.value === 'plugin-ts')
  }
  const requested = pluginsFlag
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const matched = availablePlugins.filter((p) => requested.includes(p.value))
  return matched.length > 0 ? matched : availablePlugins.filter((p) => p.value === 'plugin-ts')
}

export const initTool = defineTool(
  {
    name: 'init',
    description: 'Scaffold a kubb.config.ts in the current directory (non-interactive). Does not install packages.',
    schema: initSchema,
  },
  async ({ input = './openapi.yaml', output = './src/gen', plugins }) => {
    const selected = resolvePlugins(plugins)
    const content = generateConfigFile(selected, input, output)
    const dest = path.join(process.cwd(), KUBB_CONFIG_FILENAME)
    fs.writeFileSync(dest, content, 'utf-8')
    const packageList = ['kubb', ...selected.map((p) => p.packageName)].join(' ')
    return tool.text(`Created kubb.config.ts\n\nInstall packages:\n  npm install ${packageList}\n\nThen run:\n  npx kubb generate`)
  },
)
