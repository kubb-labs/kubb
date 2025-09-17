import type {
  WeldPacksControllerGetWeldPacks200,
  WeldPacksControllerGetWeldPacksQueryResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { weldPackSchema } from '../weldPackSchema.ts'
import { z } from 'zod/v4'

export const weldPacksControllerGetWeldPacks200Schema = z.array(weldPackSchema) as unknown as ToZod<WeldPacksControllerGetWeldPacks200>

export type WeldPacksControllerGetWeldPacks200Schema = WeldPacksControllerGetWeldPacks200

export const weldPacksControllerGetWeldPacksQueryResponseSchema =
  weldPacksControllerGetWeldPacks200Schema as unknown as ToZod<WeldPacksControllerGetWeldPacksQueryResponse>

export type WeldPacksControllerGetWeldPacksQueryResponseSchema = WeldPacksControllerGetWeldPacksQueryResponse
