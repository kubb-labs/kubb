import path from 'node:path'
import process from 'node:process'
import { CONFIG_EXTENSIONS, findConfigFile, loadConfigFile } from '@internals/shared'
import { type Config, createKubb, type Diagnostic, Diagnostics, type KubbHooks, Hookable } from '@kubb/core'
import { defineTool } from 'tmcp/tool'
import { tool } from 'tmcp/utils'
import * as v from 'valibot'
import { checkConfigPath, formatDiagnostics, isRealPathInside } from '../utils.ts'
import { configPathSchema } from './shared.ts'

const generateSchema = v.object({
  configPath: configPathSchema,
  inputPath: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1),
      v.description('Path inside the working directory, or http(s) URL, of the OpenAPI/Swagger spec. Overrides `input` in the config'),
    ),
  ),
  outputPath: v.optional(
    v.pipe(v.string(), v.minLength(1), v.description('Directory inside the working directory for the generated files. Overrides `output.path` in the config')),
  ),
  logLevel: v.optional(
    v.pipe(
      v.picklist(['silent', 'info', 'verbose']),
      v.description('Log level passed to a config that exports a function. It does not change what this tool returns'),
    ),
    'info',
  ),
})

/**
 * Checks the spec and the output folder against the working directory, and returns the reason when one is refused.
 * The AI client supplies them or wrote them to the config with `kubb_init`, and `output.clean` empties the output folder.
 * Core resolves both against `config.root`, which the loader already made absolute, so the check does as well.
 * `file` is the config that holds `output` when the AI client did not pass it.
 */
async function checkPaths({
  root,
  base,
  input,
  output,
  file,
}: {
  root: string
  base: string
  input?: string
  output?: string
  file?: string
}): Promise<string | undefined> {
  if (output && !(await isRealPathInside({ target: path.resolve(root, output), base }))) {
    return `Invalid ${file ? `output.path in ${file}` : 'outputPath'}: must be within the current working directory`
  }
  if (input && !/^https?:\/\//i.test(input) && !(await isRealPathInside({ target: path.resolve(root, input), base }))) {
    return 'Invalid inputPath: must be a URL or within the current working directory'
  }
  return undefined
}

export const generateTool = defineTool(
  {
    name: 'kubb_generate',
    title: 'Generate code with Kubb',
    description:
      'Run the Kubb build from kubb.config.ts and write the generated files, such as TypeScript types, clients, hooks, schemas, and mocks, to the output directory. Use it after the OpenAPI spec, the config, or the installed extensions changed. It overwrites the generated files, and it empties the output directory first when the config sets `output.clean`, so call `kubb_diff` first to preview the changes without writing. A project needs a config before this works: create one with `kubb_init`. A config that exports an array runs only its first entry. Returns the number of generated files and the warnings, or an error with each diagnostic as text and JSON: its code, location, cause, fix, and docs link.',
    schema: generateSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  async function generate(schema: v.InferInput<typeof generateSchema>) {
    const { configPath, inputPath: input, outputPath: output, logLevel } = schema
    const messages: Array<string> = []

    /**
     * The failure response: the diagnostics as text and JSON, then the messages collected so far,
     * such as warnings, so the agent sees everything the run said.
     */
    const failure = (title: string, diagnostics: ReadonlyArray<Diagnostic>) => {
      const serialized = diagnostics.map((diagnostic) => Diagnostics.serialize(diagnostic))
      const log = messages.length ? `\n\nMessages:\n${messages.join('\n')}` : ''
      return tool.error(`${title}:\n${formatDiagnostics(diagnostics)}\n\n\`\`\`json\n${JSON.stringify(serialized, null, 2)}\n\`\`\`${log}`)
    }

    try {
      const hooks = new Hookable<KubbHooks>()

      const notify = (type: string, message: string, data?: Record<string, unknown>) => {
        messages.push(data ? `${type}: ${message} ${JSON.stringify(data)}` : `${type}: ${message}`)
      }

      hooks.hook('kubb:error', ({ error }) => notify('ERROR', error.message))
      hooks.hook('kubb:warn', ({ message }) => notify('WARN', message))
      hooks.hook('kubb:diagnostic', ({ diagnostic }) => notify('DIAGNOSTIC', diagnostic.message, Diagnostics.serialize(diagnostic)))

      const base = path.resolve(process.cwd())
      const checked = configPath ? await checkConfigPath(configPath) : undefined
      if (checked && 'error' in checked) return tool.error(checked.error)
      const file = checked?.file ?? findConfigFile(base)
      if (!file) {
        return tool.error(
          `No config file found. Pass configPath, call kubb_init, or create one of: ${CONFIG_EXTENSIONS.map((extension) => `kubb.config${extension}`).join(', ')}`,
        )
      }

      let userConfig: Config
      try {
        const [first] = await loadConfigFile<Config>({ file, cli: { logLevel, config: configPath } })
        if (!first)
          throw new Diagnostics.Error({
            code: Diagnostics.code.unknown,
            severity: 'error',
            message: 'The config file exports an empty array of configurations',
          })
        userConfig = first
      } catch (error) {
        return failure(`Failed to load config ${file}`, [Diagnostics.from(error)])
      }

      const refusal = await checkPaths({
        root: userConfig.root ?? base,
        base,
        input,
        output: output ?? userConfig.output?.path,
        file: output ? undefined : file,
      })
      if (refusal) return tool.error(refusal)

      const config: Config = {
        ...userConfig,
        input: input ?? userConfig.input,
        output: output
          ? {
              ...userConfig.output,
              path: output,
            }
          : userConfig.output,
      }

      notify('CONFIG_READY', 'Configuration ready')

      const kubb = createKubb(config, { hooks })
      const result = await kubb.generate()
      notify('BUILD_END', `Build complete - Generated ${result.files.length} files`)

      const problems = result.diagnostics.filter(Diagnostics.isProblem)
      const errors = problems.filter((diagnostic) => diagnostic.severity === 'error')
      if (errors.length > 0) {
        notify('BUILD_FAILED', `Build failed with ${errors.length} diagnostic(s)`)

        return failure('Build failed', problems)
      }

      notify('BUILD_SUCCESS', `Build completed successfully - Generated ${result.files.length} files`)

      return tool.text(`Build completed successfully!\n\nGenerated ${result.files.length} files\n\n${messages.join('\n')}`)
    } catch (caughtError) {
      return failure('Build error', [Diagnostics.from(caughtError)])
    }
  },
)
