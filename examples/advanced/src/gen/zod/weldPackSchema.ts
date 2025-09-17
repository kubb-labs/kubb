import type { WeldPack } from '../models/ts/WeldPack.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { tenantSchema } from './tenantSchema.ts'
import { weldPackTypeSchema } from './weldPackTypeSchema.ts'
import { z } from 'zod/v4'

export const weldPackSchema = z.object({
  id: z.number(),
  initialWeldCredits: z.number(),
  consumedWeldCredits: z.number(),
  activationDate: z.iso.datetime({ offset: true }).nullable(),
  durationDays: z.number(),
  lastActivationDate: z.iso.datetime({ offset: true }).nullable(),
  get type() {
    return weldPackTypeSchema
  },
  isDeactivated: z.boolean(),
  get tenant() {
    return tenantSchema.nullable()
  },
  expirationDate: z.iso.datetime({ offset: true }),
  isActive: z.boolean(),
}) as unknown as ToZod<WeldPack>

export type WeldPackSchema = WeldPack
