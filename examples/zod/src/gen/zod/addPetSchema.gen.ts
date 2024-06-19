import { z } from "../../zod.ts";
import { petSchema } from "./petSchema.gen";
import { addPetRequestSchema } from "./addPetRequestSchema.gen";

 /**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema);
/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({ "code": z.coerce.number().optional(), "message": z.coerce.string().optional() });
/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema);
/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema);