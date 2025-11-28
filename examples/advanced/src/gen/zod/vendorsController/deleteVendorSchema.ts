import type { DeleteVendorPathParams, DeleteVendor200, DeleteVendorMutationResponse } from '../../models/ts/vendorsController/DeleteVendor.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { z } from 'zod'

export const deleteVendorPathParamsSchema = z.object({
  id: z.string(),
}) as unknown as ToZod<DeleteVendorPathParams>

export type DeleteVendorPathParamsSchema = DeleteVendorPathParams

/**
 * @description deleteVendor 200 response
 */
export const deleteVendor200Schema = z.any() as unknown as ToZod<DeleteVendor200>

export type DeleteVendor200Schema = DeleteVendor200

export const deleteVendorMutationResponseSchema = z.lazy(() => deleteVendor200Schema) as unknown as ToZod<DeleteVendorMutationResponse>

export type DeleteVendorMutationResponseSchema = DeleteVendorMutationResponse
