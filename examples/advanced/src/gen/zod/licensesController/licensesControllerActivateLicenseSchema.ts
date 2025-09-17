import type {
  LicensesControllerActivateLicensePathParams,
  LicensesControllerActivateLicense200,
  LicensesControllerActivateLicenseMutationRequest,
  LicensesControllerActivateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerActivateLicense.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { activateLicenseDtoSchema } from '../activateLicenseDtoSchema.ts'
import { licenseSchema } from '../licenseSchema.ts'
import { z } from 'zod/v4'

export const licensesControllerActivateLicensePathParamsSchema = z.object({
  id: z.coerce.number(),
}) as unknown as ToZod<LicensesControllerActivateLicensePathParams>

export type LicensesControllerActivateLicensePathParamsSchema = LicensesControllerActivateLicensePathParams

export const licensesControllerActivateLicense200Schema = licenseSchema as unknown as ToZod<LicensesControllerActivateLicense200>

export type LicensesControllerActivateLicense200Schema = LicensesControllerActivateLicense200

export const licensesControllerActivateLicenseMutationRequestSchema =
  activateLicenseDtoSchema as unknown as ToZod<LicensesControllerActivateLicenseMutationRequest>

export type LicensesControllerActivateLicenseMutationRequestSchema = LicensesControllerActivateLicenseMutationRequest

export const licensesControllerActivateLicenseMutationResponseSchema =
  licensesControllerActivateLicense200Schema as unknown as ToZod<LicensesControllerActivateLicenseMutationResponse>

export type LicensesControllerActivateLicenseMutationResponseSchema = LicensesControllerActivateLicenseMutationResponse
