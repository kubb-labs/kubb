import { z } from 'zod'
import type { PetNotFound } from '../models/ts/PetNotFound'

export const petNotFoundSchema = z.object({ code: z.coerce.number().optional(), message: z.coerce.string().optional() }) as z.ZodType<PetNotFound>
