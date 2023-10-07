import React from 'react'
import type { ReactNode } from 'react'
import { Text } from './Text.tsx'

type Props = {
  readonly name: string
  readonly export?: boolean
  readonly async?: boolean
  readonly generics?: string[]
  readonly params?: string
  readonly returnType?: string
  readonly children?: ReactNode
}

export function Function({ name, export: canExport, async, generics, params, returnType, children }: Props): React.ReactNode {
  return (
    <>
      {canExport && <Text>export </Text>}
      {async && <Text>async </Text>}
      <Text>function {name}</Text>
      {generics && (
        <Text>
          {'<'}
          {generics.join(',')}
          {'>'}
        </Text>
      )}
      <Text>({params})</Text>
      {returnType && <Text>: {returnType}</Text>}
      <Text>{' {'}</Text>
      <br />
      <Text indentSize={4}>{children}</Text>
      <br />
      <Text>{'};'}</Text>
    </>
  )
}

export function ArrowFunction({ name, export: canExport, async, generics, params, returnType, children }: Props): React.ReactNode {
  return (
    <>
      {canExport && <Text>export </Text>}
      <Text>const {name} = </Text>
      {async && <Text>async </Text>}
      {generics && (
        <Text>
          {'<'}
          {generics.join(',')}
          {'>'}
        </Text>
      )}
      <Text>({params})</Text>
      {returnType && !async && <Text>: {returnType}</Text>}
      {returnType && async && (
        <Text>
          : Promise{'<'}
          {returnType}
          {'>'}
        </Text>
      )}
      <Text>{' => {'}</Text>
      <br />
      <Text indentSize={4}>{children}</Text>
      <br />
      <Text>{'};'}</Text>
    </>
  )
}

Function.Arrow = ArrowFunction

export const Fun = Function
