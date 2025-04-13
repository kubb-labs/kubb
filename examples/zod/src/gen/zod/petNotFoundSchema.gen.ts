import { z } from '../../zod.ts'

export const petNotFoundSchema = z.object({
  code: z.int().optional(),
  message: z.string().optional(),
})

export type PetNotFoundSchema = z.infer<typeof petNotFoundSchema>
