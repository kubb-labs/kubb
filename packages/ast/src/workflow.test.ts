import { describe, expect, it } from 'vitest'
import { createInput, createOperation, createStep, createWorkflow } from './factory.ts'
import { isStepNode, isWorkflowNode } from './guards.ts'
import type { StepNode, WorkflowNode } from './nodes/index.ts'
import { collect, transform, walk } from './visitor.ts'

describe('workflow factories', () => {
  it('createStep sets the kind', () => {
    expect(createStep({ stepId: 'createPet', operationId: 'addPet' })).toEqual({
      kind: 'Step',
      stepId: 'createPet',
      operationId: 'addPet',
    })
  })

  it('createWorkflow defaults steps to an empty array', () => {
    expect(createWorkflow({ workflowId: 'adoptAPet' }).steps).toEqual([])
  })
})

describe('workflow guards', () => {
  it('narrows Workflow and Step nodes', () => {
    const workflow = createWorkflow({ workflowId: 'w', steps: [createStep({ stepId: 's' })] })

    expect(isWorkflowNode(workflow)).toBe(true)
    expect(isStepNode(workflow.steps[0])).toBe(true)
    expect(isWorkflowNode(workflow.steps[0])).toBe(false)
  })
})

describe('generalized operation', () => {
  it('builds an operation without HTTP method/path', () => {
    const op = createOperation({ operationId: 'onPetAdded', protocol: 'kafka', action: 'receive', channel: 'pet.added' })

    expect(op.method).toBeUndefined()
    expect(op.path).toBeUndefined()
    expect(op.action).toBe('receive')
    expect(op.channel).toBe('pet.added')
  })
})

describe('workflow traversal', () => {
  const build = () =>
    createInput({
      workflows: [createWorkflow({ workflowId: 'adoptAPet', steps: [createStep({ stepId: 'createPet' }), createStep({ stepId: 'getPet' })] })],
    })

  it('walks workflows and steps from the root', async () => {
    const visited = { workflow: 0, step: 0 }
    await walk(build(), {
      workflow() {
        visited.workflow++
      },
      step() {
        visited.step++
      },
    })

    expect(visited).toEqual({ workflow: 1, step: 2 })
  })

  it('collects step ids', () => {
    const ids = collect<string>(build(), {
      step(node) {
        return node.stepId
      },
    })

    expect(ids).toEqual(['createPet', 'getPet'])
  })

  it('transforms a step and preserves identity elsewhere (structural sharing)', () => {
    const root = build()

    expect(transform(root, {})).toBe(root)

    const result = transform(root, {
      step(node): StepNode {
        return node.stepId === 'getPet' ? { ...node, description: 'fetch the pet' } : node
      },
    })

    expect(result).not.toBe(root)
    const workflow = result.workflows?.[0] as WorkflowNode
    expect(workflow.steps[0]).toBe(root.workflows?.[0]?.steps[0]) // untouched step kept by reference
    expect(workflow.steps[1]?.description).toBe('fetch the pet')
  })
})
