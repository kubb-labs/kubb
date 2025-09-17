import type { TenantsControllerGetTenants200, TenantsControllerGetTenantsQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetTenants.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { tenantSchema } from '../tenantSchema.ts'
import { z } from 'zod/v4'

export const tenantsControllerGetTenants200Schema = z.array(tenantSchema) as unknown as ToZod<TenantsControllerGetTenants200>

export type TenantsControllerGetTenants200Schema = TenantsControllerGetTenants200

export const tenantsControllerGetTenantsQueryResponseSchema = tenantsControllerGetTenants200Schema as unknown as ToZod<TenantsControllerGetTenantsQueryResponse>

export type TenantsControllerGetTenantsQueryResponseSchema = TenantsControllerGetTenantsQueryResponse
