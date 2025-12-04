import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  UpdateVendor200,
  UpdateVendorHeaderParams,
  UpdateVendorMutationRequest,
  UpdateVendorMutationResponse,
  UpdateVendorPathParams,
} from '../../models/ts/vendorsController/UpdateVendor.ts'
import { updateVendorRequestSchema } from '../updateVendorRequestSchema.ts'
import { vendorResponseSchema } from '../vendorResponseSchema.ts'

export const updateVendorPathParamsSchema = z.object({
  id: z.string(),
}) as unknown as ToZod<UpdateVendorPathParams>

export type UpdateVendorPathParamsSchema = UpdateVendorPathParams

export const updateVendorHeaderParamsSchema = z
  .object({
    'Idempotency-Key': z.string().nullish(),
  })
  .optional() as unknown as ToZod<UpdateVendorHeaderParams>

export type UpdateVendorHeaderParamsSchema = UpdateVendorHeaderParams

/**
 * @description updateVendor 200 response
 */
export const updateVendor200Schema = z.lazy(() => vendorResponseSchema) as unknown as ToZod<UpdateVendor200>

export type UpdateVendor200Schema = UpdateVendor200

export const updateVendorMutationRequestSchema = z.lazy(() => updateVendorRequestSchema) as unknown as ToZod<UpdateVendorMutationRequest>

export type UpdateVendorMutationRequestSchema = UpdateVendorMutationRequest

export const updateVendorMutationResponseSchema = z.lazy(() => updateVendor200Schema) as unknown as ToZod<UpdateVendorMutationResponse>

export type UpdateVendorMutationResponseSchema = UpdateVendorMutationResponse
