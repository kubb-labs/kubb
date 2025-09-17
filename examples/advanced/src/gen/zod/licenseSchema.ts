import type { License } from '../models/ts/License.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseTypeSchema } from './licenseTypeSchema.ts'
import { z } from 'zod/v4'

export const licenseSchema = z.object({
  id: z.number(),
  activationDate: z.iso.datetime({ offset: true }).nullable(),
  durationDays: z.int(),
  lastActivationDate: z.iso.datetime({ offset: true }).nullable(),
  includedWeldCredits: z.int(),
  get type() {
    return licenseTypeSchema
  },
  isDeactivated: z.boolean(),
  expirationDate: z.iso.datetime({ offset: true }),
  isActive: z.boolean(),
}) as unknown as ToZod<License>

export type LicenseSchema = License
