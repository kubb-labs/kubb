import path from 'node:path'
import { fileURLToPath } from 'node:url'

//configs
import { configs as kubbConfigs } from '@kubb/eslint-config/flat'

/** @type {import("eslint").Linter.FlatConfig[]} */
const configs = [
  ...kubbConfigs,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
        project: ['./examples/*/tsconfig.json', './docs/tsconfig.json', './packages/*/tsconfig.json'],
      },
    },
  },
]

export default configs
