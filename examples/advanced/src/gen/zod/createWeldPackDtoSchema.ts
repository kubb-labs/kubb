import type { CreateWeldPackDto } from '../models/ts/CreateWeldPackDto.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { weldPackTypeSchema } from './weldPackTypeSchema.ts'
import { z } from 'zod/v4'

export const createWeldPackDtoSchema = z.object({
  resellerId: z.number(),
  durationDays: z.number(),
  lastActivationDate: z.iso.datetime({ offset: true }).nullable(),
  initialWeldCredits: z.int(),
  get type() {
    return weldPackTypeSchema
  },
}) as unknown as ToZod<CreateWeldPackDto>

export type CreateWeldPackDtoSchema = CreateWeldPackDto
