import type {
  LicensesControllerDeleteLicensePathParams,
  LicensesControllerDeleteLicense200,
  LicensesControllerDeleteLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const licensesControllerDeleteLicensePathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<LicensesControllerDeleteLicensePathParams>

export type LicensesControllerDeleteLicensePathParamsSchema = LicensesControllerDeleteLicensePathParams

export const licensesControllerDeleteLicense200Schema = z.boolean() as unknown as ToZod<LicensesControllerDeleteLicense200>

export type LicensesControllerDeleteLicense200Schema = LicensesControllerDeleteLicense200

export const licensesControllerDeleteLicenseMutationResponseSchema =
  licensesControllerDeleteLicense200Schema as unknown as ToZod<LicensesControllerDeleteLicenseMutationResponse>

export type LicensesControllerDeleteLicenseMutationResponseSchema = LicensesControllerDeleteLicenseMutationResponse
