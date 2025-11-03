import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Pet } from '../models/ts/Pet.ts'
import { categorySchema } from './categorySchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const petSchema = z.object({
  id: z.optional(z.number().int()),
  signature: z.optional(z.string().regex(/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/)),
  name: z.string(),
  url: z.optional(z.string().url().max(255)),
  category: z.optional(z.lazy(() => categorySchema)),
  photoUrls: z.array(z.string()),
  tags: z.optional(z.array(z.lazy(() => tagTagSchema))),
  status: z.optional(z.enum(['available', 'pending', 'sold']).describe('pet status in the store')),
}) as unknown as ToZod<Pet>

export type PetSchema = Pet
