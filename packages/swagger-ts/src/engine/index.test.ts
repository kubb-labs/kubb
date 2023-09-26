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
`
/*
const advancedSchema = `
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
    category:
      $ref: '#/components/schemas/Category'
    status:
      type: string
      description: pet status in the store
      enum:
        - available
        - pending
        - sold
`
*/

const advancedSchema = `
Pet:
  type: object
  description: test
  required: true
  properties:
    id:
      type: integer
      format: int64
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

type DemoPropertyAST = CreateEngine<typeof property>['ast']
//    ^?
type DemoPropertyJSON = CreateEngine<typeof property>['json']
//    ^?

type DemoSchemaAST = CreateEngine<typeof schema>['ast']
//    ^?

type DemoSchemaJSON = CreateEngine<typeof schema>['json']
//    ^?

type DemoAdvancedSchemaAST = CreateEngine<typeof advancedSchema>['ast']
//    ^?

type DemoAdvancedSchemaJSON = CreateEngine<typeof advancedSchema>['json']
//    ^??

expectTypeOf<DemoPropertyJSON>().toEqualTypeOf<{
  type: 'Identifier'
  value: 'description'
  children: 'test'
}>()

expectTypeOf<DemoSchemaJSON>().toEqualTypeOf<{
  type: 'RootIdentifier'
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
    {
      type: 'Identifier'
      value: 'description'
      children: 'test'
    },
    {
      type: 'Identifier'
      value: 'required'
      children: 'true'
    },
  ]
}>()

expectTypeOf<DemoAdvancedSchemaJSON>().toEqualTypeOf<{
  type: 'RootIdentifier'
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
    {
      type: 'Identifier'
      value: 'description'
      children: 'test'
    },
    {
      type: 'Identifier'
      value: 'required'
      children: 'true'
    },
    {
      type: 'RootIdentifier'
      value: {
        type: 'Identifier'
        value: 'properties'
      }
      children: [
        {
          type: 'RootIdentifier'
          value: {
            type: 'Identifier'
            value: 'id'
          }
          children: [
            {
              type: 'Identifier'
              value: 'type'
              children: 'integer'
            },
            {
              type: 'Identifier'
              value: 'format'
              children: 'int64'
            },
          ]
        },
      ]
    },
  ]
}>()
