import React from 'react'

import { createJSDocBlockText } from '@kubb/core'

import { Text } from './Text.tsx'

import type { ReactNode } from 'react'

type Props = {
  name: string
  export?: boolean
  async?: boolean
  generics?: string | string[]
  params?: string
  returnType?: string
  children?: ReactNode
  JSDoc?: {
    comments: string[]
  }
}

export function Function({ name, export: canExport, async, generics, params, returnType, JSDoc, children }: Props): React.ReactNode {
  return (
    <>
      {JSDoc?.comments && (
        <>
          <Text>{createJSDocBlockText({ comments: JSDoc.comments })}</Text>
          <br />
        </>
      )}
      {canExport && <Text>export </Text>}
      {async && <Text>async </Text>}
      <Text>function {name}</Text>
      {generics && (
        <>
          <Text>{'<'}</Text>
          <Text>{Array.isArray(generics) ? generics.join(', ').trim() : generics}</Text>
          <Text>{'>'}</Text>
        </>
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
      <Text>{' {'}</Text>
      <br />
      <Text indentSize={4}>{children}</Text>
      <br />
      <Text>{'};'}</Text>
    </>
  )
}

type ArrowFunctionProps = Props & {
  singleLine?: boolean
}

export function ArrowFunction({
  name,
  export: canExport,
  async,
  generics,
  params,
  returnType,
  JSDoc,
  singleLine,
  children,
}: ArrowFunctionProps): React.ReactNode {
  return (
    <>
      {JSDoc?.comments && (
        <>
          <Text>{createJSDocBlockText({ comments: JSDoc.comments })}</Text>
          <br />
        </>
      )}
      {canExport && <Text>export </Text>}
      <Text>const {name} = </Text>
      {async && <Text>async </Text>}
      {generics && (
        <>
          <Text>{'<'}</Text>
          <Text>{Array.isArray(generics) ? generics.join(', ').trim() : generics}</Text>
          <Text>{'>'}</Text>
        </>
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
      {singleLine && (
        <>
          <Text>{' => '}</Text>
          <Text indentSize={4}>{children}</Text>
        </>
      )}

      {!singleLine && (
        <>
          <Text>{' => {'}</Text>
          <br />
          <Text indentSize={4}>{children}</Text>
          <br />
          <Text>{'};'}</Text>
        </>
      )}
    </>
  )
}

Function.Arrow = ArrowFunction

export const Fun = Function
