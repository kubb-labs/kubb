import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { PetNotFound } from '../models/ts/PetNotFound.ts'

export const petNotFoundSchema = z.object({
  code: z.optional(z.number().int()),
  message: z.optional(z.string()),
}) as unknown as ToZod<PetNotFound>

export type PetNotFoundSchema = PetNotFound
