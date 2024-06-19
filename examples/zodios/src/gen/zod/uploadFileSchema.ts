import { z } from "zod";
import { apiResponseSchema } from "./apiResponseSchema";


export const uploadFilePathParamsSchema = z.object({ "petId": z.coerce.number().describe("ID of pet to update") });

 export const uploadFileQueryParamsSchema = z.object({ "additionalMetadata": z.coerce.string().describe("Additional Metadata").optional() }).optional();
/**
 * @description successful operation
 */
export const uploadFile200Schema = z.lazy(() => apiResponseSchema);

 export const uploadFileMutationRequestSchema = z.string();
/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema);