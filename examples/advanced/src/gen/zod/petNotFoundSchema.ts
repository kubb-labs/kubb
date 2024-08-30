import type { PetNotFound } from '../models/ts/PetNotFound'
import { z } from 'zod'

export const petNotFoundSchema = z.object({ code: z.number().int().optional(), message: z.string().optional() }) as z.ZodType<PetNotFound>
