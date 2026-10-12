import { definePlugin } from '@kubb/core'
import type { PluginFactoryOptions } from '@kubb/core'
import { z } from 'zod'

export type Options = {
  /**
   * Where the plugin writes its greetings.
   */
  output?: {
    /**
     * Directory, relative to the config's `output.path`.
     */
    path: string
  }
  /**
   * Word each greeting starts with.
   *
   * @example
   * ```ts
   * greeting: 'hi'
   * ```
   */
  greeting?: 'hello' | 'hi'
  /**
   * Print greetings in capitals.
   *
   * @deprecated Use `transform` instead.
   */
  shout?: boolean
  /**
   * Rewrites each name before it is greeted.
   *
   * @see https://example.com/docs/transform
   */
  transform?: (name: string) => string
}

type ParsedOptions = Required<Pick<Options, 'output' | 'greeting'>> & Pick<Options, 'shout' | 'transform'>

type PluginGreeting = PluginFactoryOptions<'plugin-greeting', Options, ParsedOptions, never, ParsedOptions>

const optionsSchema = z.object({
  output: z.object({ path: z.string() }).default({ path: 'greetings' }).meta({ description: 'Output folder.' }),
  greeting: z.enum(['hello', 'hi']).default('hello'),
  shout: z.boolean().optional(),
  transform: z.custom<(name: string) => string>((value) => typeof value === 'function').optional(),
})

export const pluginGreeting = definePlugin<PluginGreeting>({
  meta: {
    name: 'plugin-greeting',
    displayName: 'Greeting',
    description: 'Generates a greeting per operation.',
    compatibility: { kubb: '>=5.8.0' },
  },
  schema: optionsSchema,
  setup: (options) => options,
})
