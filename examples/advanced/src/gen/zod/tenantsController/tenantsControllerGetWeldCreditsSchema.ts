import type {
  TenantsControllerGetWeldCreditsPathParams,
  TenantsControllerGetWeldCredits200,
  TenantsControllerGetWeldCreditsQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { getWeldCreditsResponseSchema } from '../getWeldCreditsResponseSchema.ts'
import { z } from 'zod/v4'

export const tenantsControllerGetWeldCreditsPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<TenantsControllerGetWeldCreditsPathParams>

export type TenantsControllerGetWeldCreditsPathParamsSchema = TenantsControllerGetWeldCreditsPathParams

export const tenantsControllerGetWeldCredits200Schema = getWeldCreditsResponseSchema as unknown as ToZod<TenantsControllerGetWeldCredits200>

export type TenantsControllerGetWeldCredits200Schema = TenantsControllerGetWeldCredits200

export const tenantsControllerGetWeldCreditsQueryResponseSchema =
  tenantsControllerGetWeldCredits200Schema as unknown as ToZod<TenantsControllerGetWeldCreditsQueryResponse>

export type TenantsControllerGetWeldCreditsQueryResponseSchema = TenantsControllerGetWeldCreditsQueryResponse
