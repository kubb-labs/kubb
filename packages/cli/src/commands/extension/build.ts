import process from 'node:process'
import { define } from 'gunshi'

/** The runner is imported when the command runs, so listing `kubb --help` never loads TypeScript. */
export const command = define({
  name: 'build',
  description:
    'Write dist/kubb.json from the extensions the package exports and its package.json. Run it after building the package. Studio, the kubb.dev registry and the docs read the manifest.',
  examples: ['kubb extension build', 'kubb extension build --entry src/index.ts --out dist/kubb.json', 'kubb extension build --check'].join('\n'),
  args: {
    entry: {
      type: 'string',
      description: 'TypeScript source entry to read option types and JSDoc from',
      default: 'src/index.ts',
    },
    out: {
      type: 'string',
      description: 'Where to write the manifest',
      default: 'dist/kubb.json',
    },
    check: {
      type: 'boolean',
      description: 'Fail when the manifest at --out is missing or out of date, instead of writing it',
      default: false,
    },
  },
  async run({ values }) {
    const { run } = await import('../../runners/extension/build.ts')
    await run({ cwd: process.cwd(), entry: values.entry, out: values.out, check: values.check })
  },
})
