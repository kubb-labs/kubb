import path from 'node:path'

import yaml from 'js-yaml'

import { oasParser, oasPathParser } from './oasParser.ts'

import type { KubbConfig } from '@kubb/core'

describe('oasParser', () => {
  const petStoreV3 = path.resolve(__dirname, '../../mocks/petStore.yaml')
  const petStoreV2 = path.resolve(__dirname, '../../mocks/petStoreV2.json')

  const yamlPetStoreString = `
openapi: '3.0.0'
info:
  title: Swagger Petstore
  version: 1.0.0
paths:
  /users/{userId}:
    get:
      tags:
        - Users
      summary: Get public user details
      operationId: getUser
      parameters:
        - $ref: "#/components/parameters/userId"
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User details retrieved successfully
                  user:
                    type: object
                    properties:
                      userId:
                        type: string
                        example: 1234343434343
components:
  parameters:
    userId:
      name: userId
      in: path
      description: Executes the action in the context of the specified user.
      required: true
      schema:
        type: string
        example: 1234343434343
  `

  const petStoreObject = yaml.load(yamlPetStoreString)

  test('check if oas and title is defined based on a Swagger(v3) file', async () => {
    const oas = await oasPathParser(petStoreV3)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })

  test('check if oas and title is defined based on a Swagger(v2) file', async () => {
    const oas = await oasPathParser(petStoreV2)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })

  test('check if oas and title is defined based on a Swagger(v3) JSON import', async () => {
    const data = await import(petStoreV2)

    const oas = await oasParser({
      input: {
        data,
      },
    } as KubbConfig)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })

  test('check if oas and title is defined based on a Swagger(v3) JSON string', async () => {
    const oas = await oasParser({
      input: {
        data: JSON.stringify(petStoreObject),
      },
    } as KubbConfig)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })

  test('check if oas and title is defined based on a Swagger(v3) JSON object', async () => {
    const oas = await oasParser({
      input: {
        data: petStoreObject,
      },
    } as KubbConfig)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })

  test('check if oas and title is defined based on a Swagger(v3) YAML', async () => {
    const oas = await oasParser({
      input: {
        data: yamlPetStoreString,
      },
    } as KubbConfig)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })
})
