import * as z from 'zod'
import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import type { ToZod } from '../.kubb/ToZod.ts'

export const petNotFoundSchema = z.object({
  code: z.optional(z.number().int()),
  message: z.optional(z.string()),
}) as unknown as ToZod<PetNotFound>

export type PetNotFoundSchema = PetNotFound
