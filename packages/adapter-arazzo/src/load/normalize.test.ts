import { describe, expect, it } from 'vitest'
import type { ArazzoDocument } from '../types.ts'
import { assertDocument, parseFromConfig, validateDocument } from './normalize.ts'

const document = {
  arazzo: '1.1.0',
  info: { title: 'Test', version: '1.0.0' },
  sourceDescriptions: [{ name: 'petStore', url: './petStore.yaml', type: 'openapi' }],
  workflows: [{ workflowId: 'login', steps: [{ stepId: 'login', operationId: 'loginUser' }] }],
} satisfies ArazzoDocument

describe('assertDocument', () => {
  it('accepts a document declaring an arazzo version', () => {
    expect(() => assertDocument(document)).not.toThrow()
  })

  it('throws when the document declares no arazzo version', () => {
    expect(() => assertDocument({ info: { title: 'x', version: '1' } } as unknown as ArazzoDocument)).toThrow(/not an Arazzo document/)
  })
})

describe('validateDocument', () => {
  it('accepts a well-formed document', () => {
    expect(() => validateDocument(document)).not.toThrow()
  })

  it('throws when the document declares no workflows', () => {
    expect(() => validateDocument({ ...document, workflows: [] })).toThrow(/no `workflows`/)
  })

  it('throws when the document declares no sourceDescriptions', () => {
    expect(() => validateDocument({ ...document, sourceDescriptions: [] })).toThrow(/no `sourceDescriptions`/)
  })

  it('throws on a duplicate workflowId', () => {
    expect(() => validateDocument({ ...document, workflows: [...document.workflows, ...document.workflows] })).toThrow(/Duplicate `workflowId`/)
  })

  it('throws on a duplicate stepId within one workflow', () => {
    const workflows = [
      {
        workflowId: 'login',
        steps: [
          { stepId: 'a', operationId: 'x' },
          { stepId: 'a', operationId: 'y' },
        ],
      },
    ]

    expect(() => validateDocument({ ...document, workflows })).toThrow(/Duplicate `stepId`/)
  })

  it('throws when a step names no target', () => {
    const workflows = [{ workflowId: 'login', steps: [{ stepId: 'a' }] }]

    expect(() => validateDocument({ ...document, workflows })).toThrow(/does not name exactly one/)
  })

  it('throws when a step names more than one target', () => {
    const workflows = [{ workflowId: 'login', steps: [{ stepId: 'a', operationId: 'x', workflowId: 'y' }] }]

    expect(() => validateDocument({ ...document, workflows })).toThrow(/does not name exactly one/)
  })
})

describe('parseFromConfig', () => {
  it('parses an inline YAML string', async () => {
    const parsed = await parseFromConfig({ type: 'data', data: 'arazzo: 1.1.0\ninfo:\n  title: Inline\n  version: 1.0.0' })

    expect(parsed.info.title).toBe('Inline')
  })

  it('clones an inline object so the caller keeps its own copy', async () => {
    const parsed = await parseFromConfig({ type: 'data', data: document })

    expect(parsed).not.toBe(document)
    expect(parsed).toStrictEqual(document)
  })

  it('throws when the path does not exist', async () => {
    await expect(parseFromConfig({ type: 'path', path: '/does/not/exist.arazzo.yaml' })).rejects.toThrow(/Cannot read the file/)
  })
})
