import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  CreateTransfer200,
  CreateTransferHeaderParams,
  CreateTransferMutationRequest,
  CreateTransferMutationResponse,
} from '../../models/ts/transfersController/CreateTransfer.ts'
import { createTransferRequestSchema } from '../createTransferRequestSchema.ts'
import { transferSchema } from '../transferSchema.ts'

export const createTransferHeaderParamsSchema = z.object({
  'Idempotency-Key': z.string(),
}) as unknown as ToZod<CreateTransferHeaderParams>

export type CreateTransferHeaderParamsSchema = CreateTransferHeaderParams

/**
 * @description createTransfer 200 response
 */
export const createTransfer200Schema = z.lazy(() => transferSchema) as unknown as ToZod<CreateTransfer200>

export type CreateTransfer200Schema = CreateTransfer200

export const createTransferMutationRequestSchema = z.lazy(() => createTransferRequestSchema) as unknown as ToZod<CreateTransferMutationRequest>

export type CreateTransferMutationRequestSchema = CreateTransferMutationRequest

export const createTransferMutationResponseSchema = z.lazy(() => createTransfer200Schema) as unknown as ToZod<CreateTransferMutationResponse>

export type CreateTransferMutationResponseSchema = CreateTransferMutationResponse
