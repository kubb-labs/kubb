import type { Reseller } from '../models/ts/Reseller.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const resellerSchema = z.object({
  id: z.number(),
  name: z.string(),
}) as unknown as ToZod<Reseller>

export type ResellerSchema = Reseller
