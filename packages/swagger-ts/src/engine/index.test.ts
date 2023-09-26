/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
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

type DemoAST1 = CreateEngine<typeof property>['ast']
//    ^?
type DemoJSON1 = CreateEngine<typeof property>['json']
//    ^?

type DemoAST2 = CreateEngine<typeof schema>['ast']
//    ^?

type DemoJSON2 = CreateEngine<typeof schema>['json']
//    ^??

expectTypeOf<DemoJSON1>().toEqualTypeOf<
  [
    {
      type: 'Identifier'
      value: 'description'
      children: 'test'
    },
  ]
>()

expectTypeOf<DemoJSON2>().toEqualTypeOf<{
  type: 'IdentifierRoot'
  value: {
    type: 'Identifier'
    value: 'Pet'
  }
  children: [
    {
      type: 'Identifier'
      value: 'type'
      children: 'object'
    },
  ]
}>()
