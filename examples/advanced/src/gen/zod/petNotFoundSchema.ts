import type { PetNotFound } from '../models/ts/PetNotFound.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const petNotFoundSchema = z.object({
  code: z.int().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<PetNotFound>

export type PetNotFoundSchema = PetNotFound
