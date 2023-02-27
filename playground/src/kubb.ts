import { atom } from 'jotai'

import packageJson from '@kubb/core/package.json'

import type { Result } from 'ts-results'
import type { JSONSchema6 } from 'json-schema'

export interface TransformationOutput {
  code: string
  fileName: string
  language: string
}

export const versionAtom = atom(new URLSearchParams(window.location.search).get('version') ?? packageJson?.version)

export const fileNameAtom = atom('')

export type TransformationResult = Result<TransformationOutput, string>

export const configSchema: JSONSchema6 = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: '@kubb/define-config',
  title: 'JSON schema for @kubb/core define-config',
  type: 'object',
  properties: {
    root: {
      type: 'string',
      description: 'Root',
      default: 'process.cwd()',
    },
    input: {
      type: 'object',
      description: 'Input type',
      properties: {
        path: {
          type: 'string',
          description: 'Your JSON schema',
        },
      },
    },
    mode: {
      type: 'string',
      description: 'Mode type',
      enum: ['single'],
    },
    hooks: {
      type: 'object',
      description: 'Hooks that can be called when a specific action is done in Kubb.',
      properties: {
        end: {
          type: 'string',
          description: 'Hook that will be called at the end of all executions.',
        },
      },
    },
    output: {
      type: 'object',
      description: 'Output type',
      properties: {
        path: {
          type: 'string',
          description: 'Output path',
        },
        clean: {
          type: 'boolean',
          description: 'Clean previous generated files',
        },
      },
    },
    plugins: {
      type: 'array',
      items: {
        type: 'array',
        prefixItems: [
          {
            type: 'string',
          },
        ],
        items: { type: 'object' },
      } as any,
      description: 'Plugins',
    },
    logLevel: {
      type: 'string',
      description: 'Log level',
      enum: ['error', 'warn', 'info', 'silent'],
    },
  },
}
