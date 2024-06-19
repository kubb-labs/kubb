import { z } from "../../zod.ts";
import { userSchema } from "./userSchema.gen";


export const updateUserPathParamsSchema = z.object({ "username": z.coerce.string().describe("name that need to be deleted") });
/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any();
/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema);

 export const updateUserMutationResponseSchema = z.any();