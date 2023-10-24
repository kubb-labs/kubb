import { oasParser } from '@kubb/swagger'

import { format } from '../../mocks/format.ts'
import { OperationGenerator } from './OperationGenerator.ts'

import type { PluginContext, PluginManager } from '@kubb/core'
import type { KubbPlugin } from '@kubb/core'

describe('OperationGenerator', () => {
  const resolvePath = () => './pets.ts'
  const resolveName: PluginContext['resolveName'] = ({ name }) => name

  it('[GET] should generate code based on a operation and optionalType `questionToken`', async () => {
    const oas = await oasParser({ root: './', output: { path: 'test', clean: true }, input: { path: 'packages/swagger-ts/mocks/petStore.yaml' } })
    const og = await new OperationGenerator(
      {
        enumType: 'asConst',
        mode: 'directory',
        dateType: 'string',
        optionalType: 'questionToken',
        usedEnumNames: {},
      },
      {
        oas,
        skipBy: [],
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        plugin: {} as KubbPlugin,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets', 'get')

    const get = await og.get(operation, og.getSchemas(operation), {} as typeof og.options)

    expect(await format(get?.source)).toEqual(
      await format(`
      export type ListPetsQueryParams = {
        /**
        * @description How many items to return at one time (max 100)
        * @type string | undefined
        */
        limit: string;
    };

    /**
    * @description unexpected error
    */
    export type ListPetsError = Error;

    /**
    * @description A paged array of pets
    */
    export type ListPetsQueryResponse = Pets;
    `),
    )

    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const getShowById = await og.get(operationShowById, og.getSchemas(operationShowById), {} as typeof og.options)

    expect(await format(getShowById?.source)).toEqual(
      await format(`
      export type ShowPetByIdPathParams = {
        /**
        * @description The id of the pet to retrieve
        * @type string
        */
        petId: string;
        /**
        * @description The id of the pet to retrieve
        * @type string
        */
        testId: string;
    };

    /**
    * @description unexpected error
    */
    export type ShowPetByIdError = Error;

    /**
    * @description Expected response to a valid request
    */
    export type ShowPetByIdQueryResponse = Pet;

    `),
    )
  })

  it('[POST] should generate code based on a operation', async () => {
    const oas = await oasParser({ root: './', output: { path: 'test', clean: true }, input: { path: 'packages/swagger-ts/mocks/petStore.yaml' } })
    const og = await new OperationGenerator(
      {
        enumType: 'asConst',
        mode: 'directory',
        dateType: 'string',
        optionalType: 'questionToken',
        usedEnumNames: {},
      },
      {
        oas,
        skipBy: [],
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        plugin: {} as KubbPlugin,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets', 'post')

    const post = await og.post(operation, og.getSchemas(operation), {} as typeof og.options)

    expect(await format(post?.source)).toEqual(
      await format(`
      /**
       * @description Null response
       */
       export type CreatePets201 = any | null;

       export type CreatePetsMutationRequest = {
           /**
           * @type string
           */
           name: string;
           /**
           * @type string
           */
           tag: string;
       };

       export type CreatePetsMutationResponse = any | null;

       /**
       * @description unexpected error
       */
       export type CreatePetsError = Error;
    `),
    )
  })
})
