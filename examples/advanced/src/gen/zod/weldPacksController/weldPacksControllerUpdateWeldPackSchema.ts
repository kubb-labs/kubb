import type {
  WeldPacksControllerUpdateWeldPackPathParams,
  WeldPacksControllerUpdateWeldPack200,
  WeldPacksControllerUpdateWeldPackMutationRequest,
  WeldPacksControllerUpdateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { updateWeldPackDtoSchema } from '../updateWeldPackDtoSchema.ts'
import { weldPackSchema } from '../weldPackSchema.ts'
import { z } from 'zod/v4'

export const weldPacksControllerUpdateWeldPackPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<WeldPacksControllerUpdateWeldPackPathParams>

export type WeldPacksControllerUpdateWeldPackPathParamsSchema = WeldPacksControllerUpdateWeldPackPathParams

export const weldPacksControllerUpdateWeldPack200Schema = weldPackSchema as unknown as ToZod<WeldPacksControllerUpdateWeldPack200>

export type WeldPacksControllerUpdateWeldPack200Schema = WeldPacksControllerUpdateWeldPack200

export const weldPacksControllerUpdateWeldPackMutationRequestSchema =
  updateWeldPackDtoSchema as unknown as ToZod<WeldPacksControllerUpdateWeldPackMutationRequest>

export type WeldPacksControllerUpdateWeldPackMutationRequestSchema = WeldPacksControllerUpdateWeldPackMutationRequest

export const weldPacksControllerUpdateWeldPackMutationResponseSchema =
  weldPacksControllerUpdateWeldPack200Schema as unknown as ToZod<WeldPacksControllerUpdateWeldPackMutationResponse>

export type WeldPacksControllerUpdateWeldPackMutationResponseSchema = WeldPacksControllerUpdateWeldPackMutationResponse
