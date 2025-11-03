import { z } from "zod/v4";

export const categorySchema = z.object({
    "id": z.optional(z.int()),
"name": z.optional(z.string())
    })

export type CategorySchema = z.infer<typeof categorySchema>