import { describe, expect, it } from 'vitest'
import { ast, type CodeNode } from '@kubb/ast'
import { rewriteNodes } from './nodeText.ts'
import type { InlineTextKind } from './nodeText.ts'

const { createArrowFunction, createConst, createFunction, createText, createType } = ast.factory

function kinds(nodes: Array<CodeNode>): Array<[string, InlineTextKind]> {
  const found: Array<[string, InlineTextKind]> = []
  rewriteNodes(nodes, (text, kind) => {
    found.push([text, kind])
    return text
  })
  return found
}

describe('rewriteNodes', () => {
  it.each([
    { node: createType({ name: 'T', nodes: [createText('{ id: number }')] }), expected: [['{ id: number }', 'type']] },
    {
      node: createConst({ name: 'c', type: 'Pet', nodes: [createText('{ id: 1 }')] }),
      expected: [
        ['Pet', 'type'],
        ['{ id: 1 }', 'value'],
      ],
    },
    {
      node: createFunction({ name: 'f', params: 'pet: Pet', generics: 'T = Pet', returnType: 'Pet', nodes: [createText('return pet')] }),
      expected: [
        ['pet: Pet', 'parameters'],
        ['T = Pet', 'typeParameters'],
        ['Pet', 'type'],
        ['return pet', 'code'],
      ],
    },
    {
      node: createConst({ name: 'c', nodes: [createArrowFunction({ name: 'f', params: 'pet: Pet', nodes: [createText('pet')] })] }),
      expected: [
        ['pet: Pet', 'parameters'],
        ['pet', 'code'],
      ],
    },
    { node: createText('const pet = 1'), expected: [['const pet = 1', 'code']] },
  ])('passes each text of a $node.kind with what it holds', ({ node, expected }) => {
    expect(kinds([node])).toEqual(expected)
  })
})
