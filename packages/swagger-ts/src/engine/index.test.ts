import { expectTypeOf } from 'expect-type'

import type { CreateEngine } from './index'

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

type Engine = CreateEngine<typeof schema>
//    ^?

type Values = Engine['$']
//    ^?

// type Test = Values['Tag']

type Pet = Values['Pet']

expectTypeOf<Engine>().toMatchTypeOf<{
  schema: typeof schema
  $: ''
}>()
