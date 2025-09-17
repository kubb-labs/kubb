import type {
  TenantsControllerGetActiveWeldPackPathParams,
  TenantsControllerGetActiveWeldPack200,
  TenantsControllerGetActiveWeldPackQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { weldPackSchema } from '../weldPackSchema.ts'
import { z } from 'zod/v4'

export const tenantsControllerGetActiveWeldPackPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<TenantsControllerGetActiveWeldPackPathParams>

export type TenantsControllerGetActiveWeldPackPathParamsSchema = TenantsControllerGetActiveWeldPackPathParams

export const tenantsControllerGetActiveWeldPack200Schema = weldPackSchema as unknown as ToZod<TenantsControllerGetActiveWeldPack200>

export type TenantsControllerGetActiveWeldPack200Schema = TenantsControllerGetActiveWeldPack200

export const tenantsControllerGetActiveWeldPackQueryResponseSchema =
  tenantsControllerGetActiveWeldPack200Schema as unknown as ToZod<TenantsControllerGetActiveWeldPackQueryResponse>

export type TenantsControllerGetActiveWeldPackQueryResponseSchema = TenantsControllerGetActiveWeldPackQueryResponse
