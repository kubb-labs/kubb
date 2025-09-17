import type {
  LicensesControllerGetLicenses200,
  LicensesControllerGetLicensesQueryResponse,
} from '../../models/ts/licensesController/LicensesControllerGetLicenses.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseSchema } from '../licenseSchema.ts'
import { z } from 'zod/v4'

export const licensesControllerGetLicenses200Schema = z.array(licenseSchema) as unknown as ToZod<LicensesControllerGetLicenses200>

export type LicensesControllerGetLicenses200Schema = LicensesControllerGetLicenses200

export const licensesControllerGetLicensesQueryResponseSchema =
  licensesControllerGetLicenses200Schema as unknown as ToZod<LicensesControllerGetLicensesQueryResponse>

export type LicensesControllerGetLicensesQueryResponseSchema = LicensesControllerGetLicensesQueryResponse
