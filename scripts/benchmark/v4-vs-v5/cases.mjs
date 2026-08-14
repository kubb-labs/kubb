/**
 * The benchmark matrix: which specs are generated with which plugin combinations,
 * and how the same combination is expressed in a v4 and a v5 config.
 *
 * Plugin sets are named after their v5 packages. `plugin-axios` maps to v4's
 * `@kubb/plugin-client`, which generated the same Axios client before the client
 * plugins were split per transport.
 */

export const specs = [
  {
    id: 'petStore',
    file: 'petStore.yaml',
    label: 'petStore.yaml',
    operations: 21,
    url: 'https://raw.githubusercontent.com/kubb-labs/plugins/main/schemas/3.0.x/petStore.yaml',
  },
  {
    id: 'twitter',
    file: 'twitter.json',
    label: 'twitter.json',
    operations: 80,
    url: 'https://raw.githubusercontent.com/kubb-labs/plugins/main/schemas/3.0.x/twitter.json',
  },
  {
    id: 'openai',
    file: 'openai.json',
    label: 'openai.json',
    operations: 288,
    url: 'https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml',
    // v4's `yaml` dependency rejects this document with "bad indentation of a mapping entry",
    // so both versions read it as JSON converted from the published YAML. v5 parses the YAML
    // fine, which means the openai rows understate the gap rather than flatter it.
    download: 'openai.yaml',
    toJson: true,
  },
]

export const pluginSets = [
  { id: 'ts', label: '`plugin-ts`', plugins: ['ts'] },
  { id: 'ts-axios', label: '`plugin-ts` + `plugin-axios`', plugins: ['ts', 'axios'] },
  {
    id: 'ts-axios-zod-faker',
    label: '`plugin-ts` + `plugin-axios` + `plugin-zod` + `plugin-faker`',
    plugins: ['ts', 'axios', 'zod', 'faker'],
  },
]

/**
 * Both versions default to these folders. Writing them out keeps the two configs
 * literally comparable, and pins the directory mode v5 no longer infers on its own.
 */
const outputPaths = {
  ts: 'types',
  axios: 'clients',
  zod: 'zod',
  faker: 'mocks',
}

const v4Imports = {
  ts: "import { pluginTs } from '@kubb/plugin-ts'",
  axios: "import { pluginClient } from '@kubb/plugin-client'",
  zod: "import { pluginZod } from '@kubb/plugin-zod'",
  faker: "import { pluginFaker } from '@kubb/plugin-faker'",
}

const v5Imports = {
  ts: "import { pluginTs } from '@kubb/plugin-ts'",
  axios: "import { pluginAxios } from '@kubb/plugin-axios'",
  zod: "import { pluginZod } from '@kubb/plugin-zod'",
  faker: "import { pluginFaker } from '@kubb/plugin-faker'",
}

function v4Call(id) {
  const output = `{ path: '${outputPaths[id]}', barrelType: false }`
  if (id === 'axios') return `pluginClient({ client: 'axios', output: ${output} })`
  return `plugin${id === 'ts' ? 'Ts' : id[0].toUpperCase() + id.slice(1)}({ output: ${output} })`
}

function v5Call(id) {
  const output = `{ path: '${outputPaths[id]}', mode: 'directory', barrel: false }`
  if (id === 'axios') return `pluginAxios({ output: ${output} })`
  return `plugin${id === 'ts' ? 'Ts' : id[0].toUpperCase() + id.slice(1)}({ output: ${output} })`
}

/**
 * v4 reads the spec through a `pluginOas` entry and every plugin re-parses it.
 * Formatting, linting, and barrel files are off so the run measures generation only.
 */
export function v4Config({ input, output, plugins }) {
  const imports = ["import { defineConfig } from '@kubb/core'", "import { pluginOas } from '@kubb/plugin-oas'", ...plugins.map((id) => v4Imports[id])]

  return `${imports.join('\n')}

export default defineConfig({
  input: { path: '${input}' },
  output: {
    path: '${output}',
    clean: true,
    format: false,
    lint: false,
    barrel: false,
  },
  plugins: [pluginOas({ validate: false, output: false }), ${plugins.map(v4Call).join(', ')}],
})
`
}

/**
 * v5 reads the spec once through `adapterOas` and hands the same AST to every plugin.
 * The output options mirror the v4 config above.
 */
export function v5Config({ input, output, plugins }) {
  const imports = ["import { defineConfig } from 'kubb/config'", "import { adapterOas } from '@kubb/adapter-oas'", ...plugins.map((id) => v5Imports[id])]

  return `${imports.join('\n')}

export default defineConfig({
  input: '${input}',
  output: {
    path: '${output}',
    clean: true,
    format: false,
    lint: false,
    barrel: false,
  },
  adapter: adapterOas({ validate: false }),
  plugins: [${plugins.map(v5Call).join(', ')}],
})
`
}
