import type { CreateLicenseDto } from '../models/ts/CreateLicenseDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { licenseTypeSchema } from './licenseTypeSchema.ts'
import { z } from 'zod/v4'

export const createLicenseDtoSchema = z.object({
  resellerId: z.number(),
  durationDays: z.number(),
  lastActivationDate: z.iso.datetime({ offset: true }).nullable(),
  includedWeldCredits: z.number(),
  get type() {
    return licenseTypeSchema
  },
}) as unknown as ToZod<CreateLicenseDto>

export type CreateLicenseDtoSchema = CreateLicenseDto
