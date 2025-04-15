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

import type { Order } from './Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrder200 = Order

/**
 * @description Invalid input
 */
export type PlaceOrder405 = any

export type PlaceOrderMutationRequest = Order

export type PlaceOrderMutationResponse = PlaceOrder200

export type PlaceOrderMutation = {
  Response: PlaceOrder200
  Request: PlaceOrderMutationRequest
  Errors: PlaceOrder405
}
