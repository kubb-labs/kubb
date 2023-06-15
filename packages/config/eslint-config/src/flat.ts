/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// prettier-ignore-start

/**
 * Configs
 */

// @ts-ignore
import eslint from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
// @ts-ignore
import prettier from 'eslint-config-prettier'
/**
 * Recommended plugins ESM
 */

// @ts-ignore
import eslintPluginRecommended from 'eslint-plugin-eslint-plugin/configs/recommended'
/**
 * Plugins
 */

// @ts-ignore
import importPlugin from 'eslint-plugin-import'
// @ts-ignore
import turboPlugin from 'eslint-plugin-turbo'
// @ts-ignore
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import vitestPlugin from 'eslint-plugin-vitest'
// @ts-ignore
import vitestGlobalsPlugin from 'eslint-plugin-vitest-globals'
/**
 * Others
 */
import globals from 'globals'

import { rules } from './rules'

import type { Linter } from 'eslint'
import { ignores } from './ignores'

/**
 * Recommended plugins CJS
 */

// @ts-ignore
const reactPluginRecommended = require('eslint-plugin-react/configs/recommended')

// prettier-ignore-end

export const config: Linter.FlatConfig = {
  files: ['**/*.{ts,tsx}'],
  ignores,
  rules: {
    ...eslint.configs.recommended.rules,
    ...turboPlugin.configs['recommended'].rules,
    ...prettier.rules,
    // @ts-ignore
    ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
    ...tsPlugin.configs['recommended'].rules,
    ...tsPlugin.configs['recommended-requiring-type-checking'].rules,
    ...rules,
  },
  plugins: {
    // @ts-ignore
    '@typescript-eslint': tsPlugin,
    vitest: vitestPlugin,
    'vitest-globals': vitestGlobalsPlugin,
    'unused-imports': unusedImportsPlugin,
    import: importPlugin,
    turbo: turboPlugin,
  },
  languageOptions: {
    ecmaVersion: 'latest',
    globals: {
      ...globals['node'],
      ...vitestGlobalsPlugin.environments.env.globals,
      __dirname: true,
      NodeJS: true,
    },
    // @ts-ignore
    parser: tsParser,
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      tsconfigRootDir: __dirname,
      /**
       * Removes 'WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.'
       */
      warnOnUnsupportedTypeScriptVersion: false,
    },
  },
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: true,
      typescript: {
        project: 'packages/*/tsconfig.json',
      },
    },
    react: {
      version: 'detect',
    },
    next: {
      rootDir: ['docs/*/'],
    },
  },
}

const configExamples: Linter.FlatConfig = {
  files: ['examples/**', 'e2e/**'],
  rules: {
    'import/extensions': [
      'off',
      'ignorePackages',
      {
        js: 'always',
        jsx: 'always',
        ts: 'always',
        tsx: 'always',
      },
    ],
  },
}

export const configs: Linter.FlatConfig[] = [
  reactPluginRecommended as Linter.FlatConfig,
  eslintPluginRecommended as Linter.FlatConfig,
  config,
  configExamples,
].map((flatConfig) => {
  return {
    ...flatConfig,
    ignores: [...ignores, ...(flatConfig.ignores || [])],
  }
})

export default config
