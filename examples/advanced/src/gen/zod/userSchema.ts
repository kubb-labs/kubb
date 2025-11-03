import { tagTagSchema } from "./tag/tagSchema.ts";
import { z } from "zod/v4";

export const userSchema = z.object({
    "id": z.optional(z.int()),
"username": z.optional(z.string()),
"uuid": z.optional(z.uuid()),
get "tag"(){
                return z.optional(tagTagSchema.describe("The active tag"))
              },
"firstName": z.optional(z.string()),
"lastName": z.optional(z.string()),
"email": z.optional(z.email()),
"password": z.optional(z.string()),
"phone": z.optional(z.string()),
"userStatus": z.optional(z.int().describe("User Status"))
    })

export type UserSchema = z.infer<typeof userSchema>