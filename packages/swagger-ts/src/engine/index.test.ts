import { expectTypeOf } from 'expect-type'

import type { CreateEngine } from './index'

const property = `
description: test
`

const schema = `
Pet:
  type: object
  description: test
  required: true
  test: aho
`

const doubleSchema = `
Pet:
  type: object
  required:
    - name
  properties:
    id:
      type: integer
      format: int64
    name:
      type: string
Tag:
  type: object
  properties:
    id:
      type: integer
      format: int64
    name:
      type: string
`

type Demo1 = CreateEngine<typeof property>['json']
//    ^?

type Demo2 = CreateEngine<typeof schema>['json']
//    ^??

expectTypeOf<Demo1>().toEqualTypeOf<{
  type: 'Identifier'
  value: 'description'
  children: 'test'
}>()

expectTypeOf<Demo2>().toEqualTypeOf<{
  type: 'IdentifierRoot'
  value: {
    type: 'Identifier'
    value: 'Pet'
  }
  children: {
    type: 'Identifier'
    value: 'type'
    children: 'object'
  }
}>()
