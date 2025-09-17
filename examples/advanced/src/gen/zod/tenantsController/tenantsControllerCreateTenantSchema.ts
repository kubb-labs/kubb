import type {
  TenantsControllerCreateTenant201,
  TenantsControllerCreateTenantMutationRequest,
  TenantsControllerCreateTenantMutationResponse,
} from '../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { createTenantDtoSchema } from '../createTenantDtoSchema.ts'
import { tenantSchema } from '../tenantSchema.ts'

export const tenantsControllerCreateTenant201Schema = tenantSchema as unknown as ToZod<TenantsControllerCreateTenant201>

export type TenantsControllerCreateTenant201Schema = TenantsControllerCreateTenant201

export const tenantsControllerCreateTenantMutationRequestSchema = createTenantDtoSchema as unknown as ToZod<TenantsControllerCreateTenantMutationRequest>

export type TenantsControllerCreateTenantMutationRequestSchema = TenantsControllerCreateTenantMutationRequest

export const tenantsControllerCreateTenantMutationResponseSchema =
  tenantsControllerCreateTenant201Schema as unknown as ToZod<TenantsControllerCreateTenantMutationResponse>

export type TenantsControllerCreateTenantMutationResponseSchema = TenantsControllerCreateTenantMutationResponse
