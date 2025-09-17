import type {
  LicensesControllerDeactivateLicensePathParams,
  LicensesControllerDeactivateLicense200,
  LicensesControllerDeactivateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseSchema } from '../licenseSchema.ts'
import { z } from 'zod/v4'

export const licensesControllerDeactivateLicensePathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<LicensesControllerDeactivateLicensePathParams>

export type LicensesControllerDeactivateLicensePathParamsSchema = LicensesControllerDeactivateLicensePathParams

export const licensesControllerDeactivateLicense200Schema = licenseSchema as unknown as ToZod<LicensesControllerDeactivateLicense200>

export type LicensesControllerDeactivateLicense200Schema = LicensesControllerDeactivateLicense200

export const licensesControllerDeactivateLicenseMutationResponseSchema =
  licensesControllerDeactivateLicense200Schema as unknown as ToZod<LicensesControllerDeactivateLicenseMutationResponse>

export type LicensesControllerDeactivateLicenseMutationResponseSchema = LicensesControllerDeactivateLicenseMutationResponse
