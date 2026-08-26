import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { narrowSchema } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { adapterArazzo } from './adapter.ts'
import type { ArazzoOperationNode } from './types.ts'

const mocks = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../mocks')
const source = { type: 'path', path: path.join(mocks, 'workflows.arazzo.yaml') } as const

async function parse() {
  return adapterArazzo({ validate: false }).parse(source)
}

function workflow(operations: Array<{ operationId: string }>, workflowId: string): ArazzoOperationNode {
  return operations.find((operation) => operation.operationId === workflowId) as ArazzoOperationNode
}

describe('adapterArazzo.parse', () => {
  it('emits one operation per workflow', async () => {
    const node = await parse()

    expect(node.operations.map((operation) => operation.operationId)).toStrictEqual(['loginAndReadPet', 'readPetOnly'])
    expect(node.operations.every((operation) => operation.protocol === 'arazzo')).toBe(true)
  })

  it('reads the document metadata', async () => {
    const node = await parse()

    expect(node.meta.title).toBe('Pet Store workflows')
    expect(node.meta.version).toBe('1.0.0')
  })

  it('converts workflow inputs into a named schema', async () => {
    const node = await parse()

    const inputs = narrowSchema(
      node.schemas.find((schema) => schema.name === 'LoginAndReadPetInputs'),
      'object',
    )

    expect(inputs?.properties.map((property) => [property.name, property.required])).toStrictEqual([
      ['username', true],
      ['petId', false],
    ])
  })

  it('converts components.inputs into named schemas', async () => {
    const node = await parse()

    expect(node.schemas.map((schema) => schema.name)).toContain('Credentials')
  })

  it('resolves a step operationId written as a source expression', async () => {
    const node = await parse()

    expect(workflow(node.operations, 'loginAndReadPet').steps[0]).toMatchObject({
      stepId: 'login',
      sourceName: 'petStore',
      operationId: 'loginUser',
    })
  })

  it('resolves a step operationPath to its operation', async () => {
    const node = await parse()

    expect(workflow(node.operations, 'loginAndReadPet').steps[1]).toMatchObject({
      stepId: 'readPet',
      sourceName: 'petStore',
      operationId: 'getPetById',
    })
  })

  it('resolves a bare operationId against every loaded source', async () => {
    const node = await parse()

    expect(workflow(node.operations, 'readPetOnly').steps[0]?.operationId).toBe('getPetById')
  })

  it('keeps step runtime expressions as written', async () => {
    const node = await parse()

    expect(workflow(node.operations, 'loginAndReadPet').steps[0]).toMatchObject({
      outputs: { token: '$response.body#/token', expires: '$response.header.X-Expires-After' },
      successCriteria: [{ condition: '$statusCode == 200' }],
      timeout: 5000,
    })
  })

  it("layers a step's parameters over the ones the workflow declares for all steps", async () => {
    const node = await parse()

    expect(workflow(node.operations, 'loginAndReadPet').steps[0]?.parameters).toStrictEqual([
      { name: 'X-Trace', in: 'header', value: 'kubb' },
      { name: 'username', in: 'query', value: '$inputs.username' },
    ])
  })

  it('gives a step with no parameters of its own the workflow-level ones', async () => {
    const node = await parse()

    expect(workflow(node.operations, 'loginAndReadPet').steps[1]?.parameters).toStrictEqual([
      { name: 'X-Trace', in: 'header', value: 'kubb' },
      { name: 'username', in: 'query', value: 'workflow-default' },
      { name: 'petId', in: 'path', value: '$inputs.petId' },
    ])
  })

  it("layers a step's failure actions over the workflow-level ones and resolves reusables", async () => {
    const node = await parse()

    expect(workflow(node.operations, 'loginAndReadPet').steps[0]?.onFailure).toStrictEqual([
      { name: 'giveUp', type: 'retry', retryLimit: 3 },
      { name: 'notFound', type: 'end' },
    ])
  })

  it("carries a step's success actions", async () => {
    const node = await parse()

    expect(workflow(node.operations, 'loginAndReadPet').steps[0]?.onSuccess).toStrictEqual([{ name: 'next', type: 'goto', stepId: 'readPet' }])
  })

  it('carries the workflows a workflow depends on', async () => {
    const node = await parse()

    expect(workflow(node.operations, 'readPetOnly').dependsOn).toStrictEqual(['loginAndReadPet'])
    expect(workflow(node.operations, 'readPetOnly').tags).toStrictEqual([])
  })

  it('types a workflow output that reads a step response body property', async () => {
    const node = await parse()

    const outputs = narrowSchema(
      node.schemas.find((schema) => schema.name === 'LoginAndReadPetOutputs'),
      'object',
    )

    expect(outputs?.properties.find((property) => property.name === 'token')?.schema.type).toBe('string')
  })

  it('types a workflow output that reads a whole step response body', async () => {
    const node = await parse()

    const outputs = narrowSchema(
      node.schemas.find((schema) => schema.name === 'LoginAndReadPetOutputs'),
      'object',
    )
    const pet = outputs?.properties.find((property) => property.name === 'pet')?.schema

    expect(pet?.type).toBe('ref')
    expect(pet?.name).toBe('Pet')
  })

  it('walks a pointer through a referenced response schema', async () => {
    const node = await parse()

    const outputs = narrowSchema(
      node.schemas.find((schema) => schema.name === 'LoginAndReadPetOutputs'),
      'object',
    )

    expect(outputs?.properties.find((property) => property.name === 'status')?.schema.type).toBe('enum')
  })

  it('points the request body and response at the named workflow schemas', async () => {
    const node = await parse()
    const operation = workflow(node.operations, 'loginAndReadPet')

    expect(operation.requestBody?.content?.[0]?.schema).toMatchObject({ type: 'ref', targetName: 'LoginAndReadPetInputs' })
    expect(operation.responses[0]?.content?.[0]?.schema).toMatchObject({ type: 'ref', targetName: 'LoginAndReadPetOutputs' })
  })

  it('parses each source once when the same source is parsed twice', async () => {
    const adapter = adapterArazzo({ validate: false })

    const [first, second] = await Promise.all([adapter.parse(source), adapter.parse(source)])

    expect(first).toBe(second)
  })
})

describe('adapterArazzo.parse with unresolvable references', () => {
  const unknownSource = { type: 'path', path: path.join(mocks, 'withUnknownStep.arazzo.yaml') } as const

  it('keeps a step whose operation no source defines, with no resolved target', async () => {
    const node = await adapterArazzo({ validate: false }).parse(unknownSource)

    expect(workflow(node.operations, 'readMissing').steps[0]).toMatchObject({ stepId: 'missing', operationId: undefined, sourceName: undefined })
  })

  it('resolves a reusable parameter reference and keeps its value override', async () => {
    const node = await adapterArazzo({ validate: false }).parse(unknownSource)

    expect(workflow(node.operations, 'readMissing').steps[1]?.parameters).toStrictEqual([{ name: 'petId', in: 'path', value: 42 }])
  })

  it('falls back to the unknown type for an output it cannot follow', async () => {
    const node = await adapterArazzo({ validate: false }).parse(unknownSource)

    const outputs = narrowSchema(
      node.schemas.find((schema) => schema.name === 'ReadMissingOutputs'),
      'object',
    )

    expect(outputs?.properties[0]?.schema.type).toBe('unknown')
  })

  it('throws when a source description URL is relative and the input is inline data', async () => {
    const document = {
      arazzo: '1.1.0',
      info: { title: 'Inline', version: '1.0.0' },
      sourceDescriptions: [{ name: 'petStore', url: './petStore.yaml', type: 'openapi' }],
      workflows: [{ workflowId: 'noop', steps: [{ stepId: 'a', operationId: 'x' }] }],
    }

    await expect(adapterArazzo({ validate: false }).parse({ type: 'data', data: document })).rejects.toThrow(/nothing to resolve against/)
  })
})
