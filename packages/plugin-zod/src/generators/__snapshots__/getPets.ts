import { z } from "zod";

 export const listPetsQueryParams = z.object({ "limit": z.string().describe("How many items to return at one time (max 100)").optional() }).optional();

 /**
 * @description A paged array of pets
 */
export const listPets200 = z.lazy(() => pets);

 /**
 * @description unexpected error
 */
export const listPetsError = z.lazy(() => error);

 export const listPetsQueryResponse = z.lazy(() => listPets200);
