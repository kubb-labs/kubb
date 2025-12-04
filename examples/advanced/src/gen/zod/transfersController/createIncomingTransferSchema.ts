import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  CreateIncomingTransfer200,
  CreateIncomingTransferHeaderParams,
  CreateIncomingTransferMutationRequest,
  CreateIncomingTransferMutationResponse,
} from '../../models/ts/transfersController/CreateIncomingTransfer.ts'
import { createIncomingTransferRequestSchema } from '../createIncomingTransferRequestSchema.ts'
import { transferSchema } from '../transferSchema.ts'

export const createIncomingTransferHeaderParamsSchema = z.object({
  'Idempotency-Key': z.string(),
}) as unknown as ToZod<CreateIncomingTransferHeaderParams>

export type CreateIncomingTransferHeaderParamsSchema = CreateIncomingTransferHeaderParams

/**
 * @description createIncomingTransfer 200 response
 */
export const createIncomingTransfer200Schema = z.lazy(() => transferSchema) as unknown as ToZod<CreateIncomingTransfer200>

export type CreateIncomingTransfer200Schema = CreateIncomingTransfer200

export const createIncomingTransferMutationRequestSchema = z.lazy(
  () => createIncomingTransferRequestSchema,
) as unknown as ToZod<CreateIncomingTransferMutationRequest>

export type CreateIncomingTransferMutationRequestSchema = CreateIncomingTransferMutationRequest

export const createIncomingTransferMutationResponseSchema = z.lazy(
  () => createIncomingTransfer200Schema,
) as unknown as ToZod<CreateIncomingTransferMutationResponse>

export type CreateIncomingTransferMutationResponseSchema = CreateIncomingTransferMutationResponse
