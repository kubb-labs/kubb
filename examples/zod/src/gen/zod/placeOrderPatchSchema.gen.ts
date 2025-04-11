import type {
  PlaceOrderPatch200Type,
  PlaceOrderPatch405Type,
  PlaceOrderPatchMutationRequestType,
  PlaceOrderPatchMutationResponseType,
} from '../ts/PlaceOrderPatchType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen.ts'

/**
 * @description successful operation
 */
export const placeOrderPatch200Schema = z.lazy(() => orderSchema) as unknown as ToZod<PlaceOrderPatch200Type>

export type PlaceOrderPatch200Schema = PlaceOrderPatch200Type

/**
 * @description Invalid input
 */
export const placeOrderPatch405Schema = z.any() as unknown as ToZod<PlaceOrderPatch405Type>

export type PlaceOrderPatch405Schema = PlaceOrderPatch405Type

export const placeOrderPatchMutationRequestSchema = z.lazy(() => orderSchema) as unknown as ToZod<PlaceOrderPatchMutationRequestType>

export type PlaceOrderPatchMutationRequestSchema = PlaceOrderPatchMutationRequestType

export const placeOrderPatchMutationResponseSchema = z.lazy(() => placeOrderPatch200Schema) as unknown as ToZod<PlaceOrderPatchMutationResponseType>

export type PlaceOrderPatchMutationResponseSchema = PlaceOrderPatchMutationResponseType
