import type { PlaceOrder200Type, PlaceOrder405Type, PlaceOrderMutationRequestType, PlaceOrderMutationResponseType } from '../ts/PlaceOrderType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen.ts'

/**
 * @description successful operation
 */
export const placeOrder200Schema = z.lazy(() => orderSchema) as unknown as ToZod<PlaceOrder200Type>

export type PlaceOrder200Schema = PlaceOrder200Type

/**
 * @description Invalid input
 */
export const placeOrder405Schema = z.any() as unknown as ToZod<PlaceOrder405Type>

export type PlaceOrder405Schema = PlaceOrder405Type

export const placeOrderMutationRequestSchema = z.lazy(() => orderSchema) as unknown as ToZod<PlaceOrderMutationRequestType>

export type PlaceOrderMutationRequestSchema = PlaceOrderMutationRequestType

export const placeOrderMutationResponseSchema = z.lazy(() => placeOrder200Schema) as unknown as ToZod<PlaceOrderMutationResponseType>

export type PlaceOrderMutationResponseSchema = PlaceOrderMutationResponseType
