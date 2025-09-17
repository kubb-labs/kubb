import type {
  LicensesControllerCreateLicense201,
  LicensesControllerCreateLicenseMutationRequest,
  LicensesControllerCreateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerCreateLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { createLicenseDtoSchema } from '../createLicenseDtoSchema.ts'
import { licenseSchema } from '../licenseSchema.ts'

export const licensesControllerCreateLicense201Schema = licenseSchema as unknown as ToZod<LicensesControllerCreateLicense201>

export type LicensesControllerCreateLicense201Schema = LicensesControllerCreateLicense201

export const licensesControllerCreateLicenseMutationRequestSchema = createLicenseDtoSchema as unknown as ToZod<LicensesControllerCreateLicenseMutationRequest>

export type LicensesControllerCreateLicenseMutationRequestSchema = LicensesControllerCreateLicenseMutationRequest

export const licensesControllerCreateLicenseMutationResponseSchema =
  licensesControllerCreateLicense201Schema as unknown as ToZod<LicensesControllerCreateLicenseMutationResponse>

export type LicensesControllerCreateLicenseMutationResponseSchema = LicensesControllerCreateLicenseMutationResponse
