import { userSchema } from "./userSchema.ts";
import { z } from "zod/v4";

export const userArraySchema = z.array(userSchema)

export type UserArraySchema = z.infer<typeof userArraySchema>