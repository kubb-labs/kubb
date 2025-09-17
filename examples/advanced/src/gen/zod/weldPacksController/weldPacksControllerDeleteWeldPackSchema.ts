import type {
  WeldPacksControllerDeleteWeldPackPathParams,
  WeldPacksControllerDeleteWeldPack200,
  WeldPacksControllerDeleteWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const weldPacksControllerDeleteWeldPackPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<WeldPacksControllerDeleteWeldPackPathParams>

export type WeldPacksControllerDeleteWeldPackPathParamsSchema = WeldPacksControllerDeleteWeldPackPathParams

export const weldPacksControllerDeleteWeldPack200Schema = z.boolean() as unknown as ToZod<WeldPacksControllerDeleteWeldPack200>

export type WeldPacksControllerDeleteWeldPack200Schema = WeldPacksControllerDeleteWeldPack200

export const weldPacksControllerDeleteWeldPackMutationResponseSchema =
  weldPacksControllerDeleteWeldPack200Schema as unknown as ToZod<WeldPacksControllerDeleteWeldPackMutationResponse>

export type WeldPacksControllerDeleteWeldPackMutationResponseSchema = WeldPacksControllerDeleteWeldPackMutationResponse
