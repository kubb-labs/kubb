import { z } from "../../zod.ts";


export const updatePetWithFormPathParamsSchema = z.object({ "petId": z.coerce.number().describe("ID of pet that needs to be updated") });

 export const updatePetWithFormQueryParamsSchema = z.object({ "name": z.coerce.string().describe("Name of pet that needs to be updated").optional(), "status": z.coerce.string().describe("Status of pet that needs to be updated").optional() }).optional();
/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any();

 export const updatePetWithFormMutationResponseSchema = z.any();