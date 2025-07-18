/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrder200 = Order

/**
 * @description Invalid input
 */
export type PlaceOrder405 = unknown

export type PlaceOrderMutationRequest = Order

export type PlaceOrderMutationResponse = PlaceOrder200

export type PlaceOrderMutation = {
  Response: PlaceOrder200
  Request: PlaceOrderMutationRequest
  Errors: PlaceOrder405
}
