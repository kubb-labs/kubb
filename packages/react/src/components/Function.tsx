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

export function Function({ name, export: canExport, async, generics, params, returnType, JSDoc, children }: Props): ReactNode {
  return (
    <>
      {JSDoc?.comments && (
        <>
          <Text>{createJSDocBlockText({ comments: JSDoc.comments })}</Text>
          <br />
        </>
      )}
      {canExport && (
        <Text>
          export
          <Text.Space />
        </Text>
      )}
      {async && (
        <Text>
          async
          <Text.Space />
        </Text>
      )}
      <Text>
        function {name}
        <Text.Space />
      </Text>
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

export function ArrowFunction({ name, export: canExport, async, generics, params, returnType, JSDoc, singleLine, children }: ArrowFunctionProps): ReactNode {
  return (
    <>
      {JSDoc?.comments && (
        <>
          <Text>{createJSDocBlockText({ comments: JSDoc.comments })}</Text>
          <br />
        </>
      )}
      {canExport && (
        <Text>
          export
          <Text.Space />
        </Text>
      )}
      <Text>
        const {name} =<Text.Space />
      </Text>
      {async && (
        <Text>
          async
          <Text.Space />
        </Text>
      )}
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
