import type {
  GetTransfersByIdPathParams,
  GetTransfersById200,
  GetTransfersById400,
  GetTransfersById401,
  GetTransfersById403,
  GetTransfersById500,
  GetTransfersByIdQueryResponse,
} from '../../models/ts/transfersController/GetTransfersById.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { transferSchema } from '../transferSchema.ts'
import { z } from 'zod'

export const getTransfersByIdPathParamsSchema = z.object({
  id: z.string(),
}) as unknown as ToZod<GetTransfersByIdPathParams>

export type GetTransfersByIdPathParamsSchema = GetTransfersByIdPathParams

/**
 * @description Returns a transfer.
 */
export const getTransfersById200Schema = z.lazy(() => transferSchema) as unknown as ToZod<GetTransfersById200>

export type GetTransfersById200Schema = GetTransfersById200

/**
 * @description Bad request
 */
export const getTransfersById400Schema = z.any() as unknown as ToZod<GetTransfersById400>

export type GetTransfersById400Schema = GetTransfersById400

/**
 * @description Unauthorized
 */
export const getTransfersById401Schema = z.any() as unknown as ToZod<GetTransfersById401>

export type GetTransfersById401Schema = GetTransfersById401

/**
 * @description Forbidden
 */
export const getTransfersById403Schema = z.any() as unknown as ToZod<GetTransfersById403>

export type GetTransfersById403Schema = GetTransfersById403

/**
 * @description Internal server error
 */
export const getTransfersById500Schema = z.any() as unknown as ToZod<GetTransfersById500>

export type GetTransfersById500Schema = GetTransfersById500

export const getTransfersByIdQueryResponseSchema = z.lazy(() => getTransfersById200Schema) as unknown as ToZod<GetTransfersByIdQueryResponse>

export type GetTransfersByIdQueryResponseSchema = GetTransfersByIdQueryResponse
