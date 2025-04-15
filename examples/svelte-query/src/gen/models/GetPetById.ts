/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 * Source: petStore.yaml
 * Title: Swagger Petstore - OpenAPI 3.0
 * Description: This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about
 * Swagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
 * You can now help us improve the API whether it's by making changes to the definition itself or to the code.
 * That way, with time, we can improve the API in general, and expose some of the new features in OAS3.
 *
 * Some useful links:
 * - [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)
 * - [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)
 * OpenAPI spec version: 1.0.11
 */

import type { Pet } from './Pet.ts'

export type GetPetByIdPathParams = {
  /**
   * @description ID of pet to return
   * @type integer, int64
   */
  pet_id: number
}

/**
 * @description successful operation
 */
export type GetPetById200 = Pet

/**
 * @description Invalid ID supplied
 */
export type GetPetById400 = any

/**
 * @description Pet not found
 */
export type GetPetById404 = any

export type GetPetByIdQueryResponse = GetPetById200

export type GetPetByIdQuery = {
  Response: GetPetById200
  PathParams: GetPetByIdPathParams
  Errors: GetPetById400 | GetPetById404
}
