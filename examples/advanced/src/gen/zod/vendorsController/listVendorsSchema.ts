import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  ListVendors200,
  ListVendors400,
  ListVendors401,
  ListVendors403,
  ListVendorsQueryParams,
  ListVendorsQueryResponse,
} from '../../models/ts/vendorsController/ListVendors.ts'
import { pageVendorResponseSchema } from '../pageVendorResponseSchema.ts'

export const listVendorsQueryParamsSchema = z
  .object({
    cursor: z.string().nullish(),
    limit: z.coerce.number().int().nullish(),
    name: z.string().nullish(),
  })
  .optional() as unknown as ToZod<ListVendorsQueryParams>

export type ListVendorsQueryParamsSchema = ListVendorsQueryParams

/**
 * @description Returns a list of vendor objects.
 */
export const listVendors200Schema = z.lazy(() => pageVendorResponseSchema) as unknown as ToZod<ListVendors200>

export type ListVendors200Schema = ListVendors200

/**
 * @description Bad request
 */
export const listVendors400Schema = z.any() as unknown as ToZod<ListVendors400>

export type ListVendors400Schema = ListVendors400

/**
 * @description Unauthorized
 */
export const listVendors401Schema = z.any() as unknown as ToZod<ListVendors401>

export type ListVendors401Schema = ListVendors401

/**
 * @description Forbidden
 */
export const listVendors403Schema = z.any() as unknown as ToZod<ListVendors403>

export type ListVendors403Schema = ListVendors403

export const listVendorsQueryResponseSchema = z.lazy(() => listVendors200Schema) as unknown as ToZod<ListVendorsQueryResponse>

export type ListVendorsQueryResponseSchema = ListVendorsQueryResponse
