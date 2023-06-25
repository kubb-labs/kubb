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
  ignores: ignores.all,
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
      tsconfigRootDir: process.cwd(),
      project: true,
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
    ecmaFeatures: {
      jsx: true,
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: true,
      typescript: {
        project: `'packages/*/tsconfig.json',`,
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

export const configExamples: Linter.FlatConfig = {
  files: ['examples/**', 'e2e/**'],
  ignores: ignores.all,
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

export const configTest: Linter.FlatConfig = {
  files: ['**/*.test.ts', '**/*.test.tsx'],
  ignores: ignores.all,
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
  },
}

export const configDist: Linter.FlatConfig = {
  ignores: ignores.build,
}

export const configs: Linter.FlatConfig[] = [
  reactPluginRecommended as Linter.FlatConfig,
  eslintPluginRecommended as Linter.FlatConfig,
  config,
  configExamples,
  configTest,
  configDist,
]

export default config
