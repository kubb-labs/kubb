import { z } from "zod/v4";

export const petNotFoundSchema = z.object({
    "code": z.optional(z.int()),
"message": z.optional(z.string())
    })

export type PetNotFoundSchema = z.infer<typeof petNotFoundSchema>