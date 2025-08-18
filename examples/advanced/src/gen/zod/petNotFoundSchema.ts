import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const petNotFoundSchema = z.object({
  code: z.optional(z.int()),
  message: z.optional(z.string()),
}) as unknown as ToZod<PetNotFound>

export type PetNotFoundSchema = PetNotFound
