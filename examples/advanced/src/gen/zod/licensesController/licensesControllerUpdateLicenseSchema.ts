import type {
  LicensesControllerUpdateLicensePathParams,
  LicensesControllerUpdateLicense200,
  LicensesControllerUpdateLicenseMutationRequest,
  LicensesControllerUpdateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseSchema } from '../licenseSchema.ts'
import { updateLicenseDtoSchema } from '../updateLicenseDtoSchema.ts'
import { z } from 'zod/v4'

export const licensesControllerUpdateLicensePathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<LicensesControllerUpdateLicensePathParams>

export type LicensesControllerUpdateLicensePathParamsSchema = LicensesControllerUpdateLicensePathParams

export const licensesControllerUpdateLicense200Schema = licenseSchema as unknown as ToZod<LicensesControllerUpdateLicense200>

export type LicensesControllerUpdateLicense200Schema = LicensesControllerUpdateLicense200

export const licensesControllerUpdateLicenseMutationRequestSchema = updateLicenseDtoSchema as unknown as ToZod<LicensesControllerUpdateLicenseMutationRequest>

export type LicensesControllerUpdateLicenseMutationRequestSchema = LicensesControllerUpdateLicenseMutationRequest

export const licensesControllerUpdateLicenseMutationResponseSchema =
  licensesControllerUpdateLicense200Schema as unknown as ToZod<LicensesControllerUpdateLicenseMutationResponse>

export type LicensesControllerUpdateLicenseMutationResponseSchema = LicensesControllerUpdateLicenseMutationResponse
