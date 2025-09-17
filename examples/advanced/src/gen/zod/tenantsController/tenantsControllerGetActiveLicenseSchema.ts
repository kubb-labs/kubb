import type {
  TenantsControllerGetActiveLicensePathParams,
  TenantsControllerGetActiveLicense200,
  TenantsControllerGetActiveLicenseQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseSchema } from '../licenseSchema.ts'
import { z } from 'zod/v4'

export const tenantsControllerGetActiveLicensePathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<TenantsControllerGetActiveLicensePathParams>

export type TenantsControllerGetActiveLicensePathParamsSchema = TenantsControllerGetActiveLicensePathParams

export const tenantsControllerGetActiveLicense200Schema = licenseSchema as unknown as ToZod<TenantsControllerGetActiveLicense200>

export type TenantsControllerGetActiveLicense200Schema = TenantsControllerGetActiveLicense200

export const tenantsControllerGetActiveLicenseQueryResponseSchema =
  tenantsControllerGetActiveLicense200Schema as unknown as ToZod<TenantsControllerGetActiveLicenseQueryResponse>

export type TenantsControllerGetActiveLicenseQueryResponseSchema = TenantsControllerGetActiveLicenseQueryResponse
