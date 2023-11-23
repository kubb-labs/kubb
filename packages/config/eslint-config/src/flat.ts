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
// @ts-ignore
import tsParser from '@typescript-eslint/parser'
// @ts-ignore
import prettier from 'eslint-config-prettier'
/**
 * Recommended plugins ESM
 */
// @ts-ignore
import eslintPluginRecommended from 'eslint-plugin-eslint-plugin'
/**
 * Plugins
 */
// @ts-ignore
import importPlugin from 'eslint-plugin-import'
// @ts-ignore
import reactPlugin from 'eslint-plugin-react'
// @ts-ignore
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
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

import packageJSON from '../package.json'
import { ignores } from './ignores.ts'
import { rules } from './rules.ts'

import type { ESLint, Linter } from 'eslint'

// prettier-ignore-end

const recommended = {
  files: ['**/*.{ts,tsx}'],
  ignores: ignores.all,
  rules: {
    ...eslint.configs.recommended.rules,
    ...turboPlugin.configs['recommended'].rules,
    // @ts-ignore
    ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
    ...tsPlugin.configs['recommended']?.rules,
    ...tsPlugin.configs['recommended-requiring-type-checking']?.rules,
    ...reactPlugin.configs['recommended']?.rules,
    ...prettier.rules,
    ...rules,
  },
  plugins: {
    '': eslintPluginRecommended,
    'react': reactPlugin,
    '@typescript-eslint': tsPlugin,
    vitest: vitestPlugin,
    'vitest-globals': vitestGlobalsPlugin,
    'unused-imports': unusedImportsPlugin,
    import: importPlugin,
    turbo: turboPlugin,
    'simple-import-sort': simpleImportSortPlugin,
  } as unknown as Linter.FlatConfig['plugins'],
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
      tsconfigRootDir: process.cwd(),
      project: true,
      /**
       * Removes 'WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.'
       */
      warnOnUnsupportedTypeScriptVersion: false,
    },
  } as Linter.FlatConfig['languageOptions'],
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  settings: {
    ecmaFeatures: {
      jsx: true,
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: true,
      typescript: {
        project: true,
      },
    },
    react: {
      version: 'detect',
    },
  },
} satisfies Linter.FlatConfig

const tests = {
  files: ['**/*.test.ts', '**/*.test.tsx'],
  ignores: ignores.all,
  plugins: {
    '@typescript-eslint': tsPlugin,
  } as unknown as Linter.FlatConfig['plugins'],
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
  },
} satisfies Linter.FlatConfig

const build = {
  ignores: ignores.build,
} satisfies Linter.FlatConfig

const plugin = {
  meta: {
    name: '@kubb/eslint-config',
    version: packageJSON.version,
  },
  configs: {
    recommended,
    tests,
    build,
  },
  rules: {},
  processors: {},
} satisfies ESLint.Plugin

export default plugin
