import type {
  GetVendorByIdPathParams,
  GetVendorById200,
  GetVendorById400,
  GetVendorById401,
  GetVendorById403,
  GetVendorById500,
  GetVendorByIdQueryResponse,
} from '../../models/ts/vendorsController/GetVendorById.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { vendorResponseSchema } from '../vendorResponseSchema.ts'
import { z } from 'zod'

export const getVendorByIdPathParamsSchema = z.object({
  id: z.string(),
}) as unknown as ToZod<GetVendorByIdPathParams>

export type GetVendorByIdPathParamsSchema = GetVendorByIdPathParams

/**
 * @description Returns a vendor object.
 */
export const getVendorById200Schema = z.lazy(() => vendorResponseSchema) as unknown as ToZod<GetVendorById200>

export type GetVendorById200Schema = GetVendorById200

/**
 * @description Bad request
 */
export const getVendorById400Schema = z.any() as unknown as ToZod<GetVendorById400>

export type GetVendorById400Schema = GetVendorById400

/**
 * @description Unauthorized
 */
export const getVendorById401Schema = z.any() as unknown as ToZod<GetVendorById401>

export type GetVendorById401Schema = GetVendorById401

/**
 * @description Forbidden
 */
export const getVendorById403Schema = z.any() as unknown as ToZod<GetVendorById403>

export type GetVendorById403Schema = GetVendorById403

/**
 * @description Internal server error
 */
export const getVendorById500Schema = z.any() as unknown as ToZod<GetVendorById500>

export type GetVendorById500Schema = GetVendorById500

export const getVendorByIdQueryResponseSchema = z.lazy(() => getVendorById200Schema) as unknown as ToZod<GetVendorByIdQueryResponse>

export type GetVendorByIdQueryResponseSchema = GetVendorByIdQueryResponse
