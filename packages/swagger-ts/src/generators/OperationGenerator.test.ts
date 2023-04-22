import type { Api } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import type { PluginContext } from '@kubb/core'

import { OperationGenerator } from './OperationGenerator'

import { format } from '../../mocks/format'

describe('OperationGenerator', () => {
  const swagger = createSwagger({})
  const swaggerApi = swagger.api as Api
  const resolvePath = () => './pets.ts'
  const resolveName: PluginContext['resolveName'] = ({ name }) => name

  it('[GET] should generate code based on a operation', async () => {
    const oas = await swaggerApi.getOas({ root: './', output: { path: 'test', clean: true }, input: { path: 'packages/swagger-ts/mocks/petStore.yaml' } })
    const og = await new OperationGenerator({ oas, resolvePath, resolveName, enumType: 'asConst', mode: 'directory' })
    const operation = oas.operation('/pets', 'get')

    const get = await og.get(operation, og.getSchemas(operation))

    expect(format(get?.source)).toEqual(
      format(`
      export type ListPetsQueryParams = {
        /**
        * @type string | undefined
        */
        limit?: string | undefined;
    };
    
    /**
    * @description unexpected error
    */
    export type ListPetsError = Error;
    
    /**
    * @description A paged array of pets
    */
    export type ListPetsQueryResponse = Pets;
    `)
    )

    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const getShowById = await og.get(operationShowById, og.getSchemas(operationShowById))

    expect(format(getShowById?.source)).toEqual(
      format(`
      export type ShowPetByIdPathParams = {
        /**
        * @type string
        */
        petId: string;
        /**
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
    
    `)
    )
  })

  it('[POST] should generate code based on a operation', async () => {
    const oas = await swaggerApi.getOas({ root: './', output: { path: 'test', clean: true }, input: { path: 'packages/swagger-ts/mocks/petStore.yaml' } })
    const og = await new OperationGenerator({ oas, resolvePath, resolveName, enumType: 'asConst', mode: 'directory' })
    const operation = oas.operation('/pets', 'post')

    const post = await og.post(operation, og.getSchemas(operation))

    expect(format(post?.source)).toEqual(
      format(`
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
    `)
    )
  })
})
