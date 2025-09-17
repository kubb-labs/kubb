import type {
  PartsControllerDownloadPartPathParams,
  PartsControllerDownloadPart200,
  PartsControllerDownloadPartMutationRequest,
  PartsControllerDownloadPartMutationResponse,
} from '../../models/ts/partsController/PartsControllerDownloadPart.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { downloadPartDtoSchema } from '../downloadPartDtoSchema.ts'
import { partSchema } from '../partSchema.ts'
import { z } from 'zod/v4'

export const partsControllerDownloadPartPathParamsSchema = z.object({
  urn: z.string(),
}) as unknown as ToZod<PartsControllerDownloadPartPathParams>

export type PartsControllerDownloadPartPathParamsSchema = PartsControllerDownloadPartPathParams

export const partsControllerDownloadPart200Schema = partSchema as unknown as ToZod<PartsControllerDownloadPart200>

export type PartsControllerDownloadPart200Schema = PartsControllerDownloadPart200

export const partsControllerDownloadPartMutationRequestSchema = downloadPartDtoSchema as unknown as ToZod<PartsControllerDownloadPartMutationRequest>

export type PartsControllerDownloadPartMutationRequestSchema = PartsControllerDownloadPartMutationRequest

export const partsControllerDownloadPartMutationResponseSchema =
  partsControllerDownloadPart200Schema as unknown as ToZod<PartsControllerDownloadPartMutationResponse>

export type PartsControllerDownloadPartMutationResponseSchema = PartsControllerDownloadPartMutationResponse
