import { z } from 'zod'
import type { PetNotFound } from '../models/ts/PetNotFound'

export const petNotFoundSchema: z.ZodType<PetNotFound> = z.object({ 'code': z.number().optional(), 'message': z.string().optional() })
