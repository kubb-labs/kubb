import type {
  LicensesControllerGetLicensePathParams,
  LicensesControllerGetLicense200,
  LicensesControllerGetLicenseQueryResponse,
} from '../../models/ts/licensesController/LicensesControllerGetLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { getLicenseResponseSchema } from '../getLicenseResponseSchema.ts'
import { z } from 'zod/v4'

export const licensesControllerGetLicensePathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<LicensesControllerGetLicensePathParams>

export type LicensesControllerGetLicensePathParamsSchema = LicensesControllerGetLicensePathParams

export const licensesControllerGetLicense200Schema = getLicenseResponseSchema as unknown as ToZod<LicensesControllerGetLicense200>

export type LicensesControllerGetLicense200Schema = LicensesControllerGetLicense200

export const licensesControllerGetLicenseQueryResponseSchema =
  licensesControllerGetLicense200Schema as unknown as ToZod<LicensesControllerGetLicenseQueryResponse>

export type LicensesControllerGetLicenseQueryResponseSchema = LicensesControllerGetLicenseQueryResponse
