import type {
  TenantsControllerGetTenantPathParams,
  TenantsControllerGetTenant200,
  TenantsControllerGetTenantQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetTenant.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { getTenantResponseSchema } from '../getTenantResponseSchema.ts'
import { z } from 'zod/v4'

export const tenantsControllerGetTenantPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<TenantsControllerGetTenantPathParams>

export type TenantsControllerGetTenantPathParamsSchema = TenantsControllerGetTenantPathParams

export const tenantsControllerGetTenant200Schema = getTenantResponseSchema as unknown as ToZod<TenantsControllerGetTenant200>

export type TenantsControllerGetTenant200Schema = TenantsControllerGetTenant200

export const tenantsControllerGetTenantQueryResponseSchema = tenantsControllerGetTenant200Schema as unknown as ToZod<TenantsControllerGetTenantQueryResponse>

export type TenantsControllerGetTenantQueryResponseSchema = TenantsControllerGetTenantQueryResponse
