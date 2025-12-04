import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  CreateVendor200,
  CreateVendorHeaderParams,
  CreateVendorMutationRequest,
  CreateVendorMutationResponse,
} from '../../models/ts/vendorsController/CreateVendor.ts'
import { createVendorRequestSchema } from '../createVendorRequestSchema.ts'
import { vendorResponseSchema } from '../vendorResponseSchema.ts'

export const createVendorHeaderParamsSchema = z.object({
  'Idempotency-Key': z.string(),
}) as unknown as ToZod<CreateVendorHeaderParams>

export type CreateVendorHeaderParamsSchema = CreateVendorHeaderParams

/**
 * @description createVendor 200 response
 */
export const createVendor200Schema = z.lazy(() => vendorResponseSchema) as unknown as ToZod<CreateVendor200>

export type CreateVendor200Schema = CreateVendor200

export const createVendorMutationRequestSchema = z.lazy(() => createVendorRequestSchema) as unknown as ToZod<CreateVendorMutationRequest>

export type CreateVendorMutationRequestSchema = CreateVendorMutationRequest

export const createVendorMutationResponseSchema = z.lazy(() => createVendor200Schema) as unknown as ToZod<CreateVendorMutationResponse>

export type CreateVendorMutationResponseSchema = CreateVendorMutationResponse
