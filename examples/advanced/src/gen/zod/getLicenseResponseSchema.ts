import type { GetLicenseResponse } from '../models/ts/GetLicenseResponse.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseTypeSchema } from './licenseTypeSchema.ts'
import { resellerSchema } from './resellerSchema.ts'
import { tenantSchema } from './tenantSchema.ts'
import { z } from 'zod/v4'

export const getLicenseResponseSchema = z.object({
  id: z.number(),
  activationDate: z.iso.datetime({ offset: true }).nullable(),
  durationDays: z.number(),
  lastActivationDate: z.iso.datetime({ offset: true }).nullable(),
  includedWeldCredits: z.number(),
  get type() {
    return licenseTypeSchema
  },
  isDeactivated: z.boolean(),
  get tenant() {
    return tenantSchema.nullable()
  },
  get reseller() {
    return resellerSchema.nullable()
  },
}) as unknown as ToZod<GetLicenseResponse>

export type GetLicenseResponseSchema = GetLicenseResponse
