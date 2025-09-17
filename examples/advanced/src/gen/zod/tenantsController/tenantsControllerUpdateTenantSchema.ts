import type {
  TenantsControllerUpdateTenantPathParams,
  TenantsControllerUpdateTenant200,
  TenantsControllerUpdateTenantMutationRequest,
  TenantsControllerUpdateTenantMutationResponse,
} from '../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { tenantSchema } from '../tenantSchema.ts'
import { updateTenantDtoSchema } from '../updateTenantDtoSchema.ts'
import { z } from 'zod/v4'

export const tenantsControllerUpdateTenantPathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<TenantsControllerUpdateTenantPathParams>

export type TenantsControllerUpdateTenantPathParamsSchema = TenantsControllerUpdateTenantPathParams

export const tenantsControllerUpdateTenant200Schema = tenantSchema as unknown as ToZod<TenantsControllerUpdateTenant200>

export type TenantsControllerUpdateTenant200Schema = TenantsControllerUpdateTenant200

export const tenantsControllerUpdateTenantMutationRequestSchema = updateTenantDtoSchema as unknown as ToZod<TenantsControllerUpdateTenantMutationRequest>

export type TenantsControllerUpdateTenantMutationRequestSchema = TenantsControllerUpdateTenantMutationRequest

export const tenantsControllerUpdateTenantMutationResponseSchema =
  tenantsControllerUpdateTenant200Schema as unknown as ToZod<TenantsControllerUpdateTenantMutationResponse>

export type TenantsControllerUpdateTenantMutationResponseSchema = TenantsControllerUpdateTenantMutationResponse
