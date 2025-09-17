import type {
  WeldPacksControllerCreateWeldPack201,
  WeldPacksControllerCreateWeldPackMutationRequest,
  WeldPacksControllerCreateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { createWeldPackDtoSchema } from '../createWeldPackDtoSchema.ts'
import { weldPackSchema } from '../weldPackSchema.ts'

export const weldPacksControllerCreateWeldPack201Schema = weldPackSchema as unknown as ToZod<WeldPacksControllerCreateWeldPack201>

export type WeldPacksControllerCreateWeldPack201Schema = WeldPacksControllerCreateWeldPack201

export const weldPacksControllerCreateWeldPackMutationRequestSchema =
  createWeldPackDtoSchema as unknown as ToZod<WeldPacksControllerCreateWeldPackMutationRequest>

export type WeldPacksControllerCreateWeldPackMutationRequestSchema = WeldPacksControllerCreateWeldPackMutationRequest

export const weldPacksControllerCreateWeldPackMutationResponseSchema =
  weldPacksControllerCreateWeldPack201Schema as unknown as ToZod<WeldPacksControllerCreateWeldPackMutationResponse>

export type WeldPacksControllerCreateWeldPackMutationResponseSchema = WeldPacksControllerCreateWeldPackMutationResponse
