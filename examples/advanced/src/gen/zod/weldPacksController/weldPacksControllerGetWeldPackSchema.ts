import type {
  WeldPacksControllerGetWeldPackPathParams,
  WeldPacksControllerGetWeldPack200,
  WeldPacksControllerGetWeldPackQueryResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { weldPackSchema } from '../weldPackSchema.ts'
import { z } from 'zod/v4'

export const weldPacksControllerGetWeldPackPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<WeldPacksControllerGetWeldPackPathParams>

export type WeldPacksControllerGetWeldPackPathParamsSchema = WeldPacksControllerGetWeldPackPathParams

export const weldPacksControllerGetWeldPack200Schema = weldPackSchema as unknown as ToZod<WeldPacksControllerGetWeldPack200>

export type WeldPacksControllerGetWeldPack200Schema = WeldPacksControllerGetWeldPack200

export const weldPacksControllerGetWeldPackQueryResponseSchema =
  weldPacksControllerGetWeldPack200Schema as unknown as ToZod<WeldPacksControllerGetWeldPackQueryResponse>

export type WeldPacksControllerGetWeldPackQueryResponseSchema = WeldPacksControllerGetWeldPackQueryResponse
