import type {
  ListTransfersQueryParams,
  ListTransfers200,
  ListTransfers400,
  ListTransfers401,
  ListTransfers403,
  ListTransfers500,
  ListTransfersQueryResponse,
} from '../../models/ts/transfersController/ListTransfers.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { pageTransferSchema } from '../pageTransferSchema.ts'
import { z } from 'zod'

export const listTransfersQueryParamsSchema = z
  .object({
    cursor: z.string().nullish(),
    limit: z.coerce.number().int().nullish(),
  })
  .optional() as unknown as ToZod<ListTransfersQueryParams>

export type ListTransfersQueryParamsSchema = ListTransfersQueryParams

/**
 * @description Returns a list of transfers.
 */
export const listTransfers200Schema = z.lazy(() => pageTransferSchema) as unknown as ToZod<ListTransfers200>

export type ListTransfers200Schema = ListTransfers200

/**
 * @description Bad request
 */
export const listTransfers400Schema = z.any() as unknown as ToZod<ListTransfers400>

export type ListTransfers400Schema = ListTransfers400

/**
 * @description Unauthorized
 */
export const listTransfers401Schema = z.any() as unknown as ToZod<ListTransfers401>

export type ListTransfers401Schema = ListTransfers401

/**
 * @description Forbidden
 */
export const listTransfers403Schema = z.any() as unknown as ToZod<ListTransfers403>

export type ListTransfers403Schema = ListTransfers403

/**
 * @description Internal server error
 */
export const listTransfers500Schema = z.any() as unknown as ToZod<ListTransfers500>

export type ListTransfers500Schema = ListTransfers500

export const listTransfersQueryResponseSchema = z.lazy(() => listTransfers200Schema) as unknown as ToZod<ListTransfersQueryResponse>

export type ListTransfersQueryResponseSchema = ListTransfersQueryResponse
