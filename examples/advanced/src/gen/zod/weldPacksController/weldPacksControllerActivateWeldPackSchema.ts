import type {
  WeldPacksControllerActivateWeldPackPathParams,
  WeldPacksControllerActivateWeldPack200,
  WeldPacksControllerActivateWeldPackMutationRequest,
  WeldPacksControllerActivateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { activateWeldPackDtoSchema } from '../activateWeldPackDtoSchema.ts'
import { weldPackSchema } from '../weldPackSchema.ts'
import { z } from 'zod/v4'

export const weldPacksControllerActivateWeldPackPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<WeldPacksControllerActivateWeldPackPathParams>

export type WeldPacksControllerActivateWeldPackPathParamsSchema = WeldPacksControllerActivateWeldPackPathParams

export const weldPacksControllerActivateWeldPack200Schema = weldPackSchema as unknown as ToZod<WeldPacksControllerActivateWeldPack200>

export type WeldPacksControllerActivateWeldPack200Schema = WeldPacksControllerActivateWeldPack200

export const weldPacksControllerActivateWeldPackMutationRequestSchema =
  activateWeldPackDtoSchema as unknown as ToZod<WeldPacksControllerActivateWeldPackMutationRequest>

export type WeldPacksControllerActivateWeldPackMutationRequestSchema = WeldPacksControllerActivateWeldPackMutationRequest

export const weldPacksControllerActivateWeldPackMutationResponseSchema =
  weldPacksControllerActivateWeldPack200Schema as unknown as ToZod<WeldPacksControllerActivateWeldPackMutationResponse>

export type WeldPacksControllerActivateWeldPackMutationResponseSchema = WeldPacksControllerActivateWeldPackMutationResponse
