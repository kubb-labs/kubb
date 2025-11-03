import { userSchema } from "../userSchema.ts";
import { z } from "zod/v4";

/**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = userSchema

export type CreateUsersWithListInput200Schema = z.infer<typeof createUsersWithListInput200Schema>

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any()

export type CreateUsersWithListInputErrorSchema = z.infer<typeof createUsersWithListInputErrorSchema>

export const createUsersWithListInputMutationRequestSchema = z.array(userSchema)

export type CreateUsersWithListInputMutationRequestSchema = z.infer<typeof createUsersWithListInputMutationRequestSchema>

export const createUsersWithListInputMutationResponseSchema = createUsersWithListInput200Schema

export type CreateUsersWithListInputMutationResponseSchema = z.infer<typeof createUsersWithListInputMutationResponseSchema>