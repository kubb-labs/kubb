import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const petNotFoundSchema = z.object({
  code: z.number().int().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<PetNotFound>

export type PetNotFoundSchema = PetNotFound
