import { z } from '../../zod.ts'

export const petNotFoundSchema = z.object({
  code: z.number().int().optional(),
  message: z.string().optional(),
})

export type PetNotFoundSchema = z.infer<typeof petNotFoundSchema>
