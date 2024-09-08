import { z } from 'zod'

export const optionalPet = z.object({ id: z.number().int().optional(), name: z.string().optional(), tag: z.string().optional() })

export type OptionalPet = z.infer<typeof optionalPet>
