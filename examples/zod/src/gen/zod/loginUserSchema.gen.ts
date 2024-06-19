import { z } from "../../zod.ts";


export const loginUserQueryParamsSchema = z.object({ "username": z.coerce.string().describe("The user name for login").optional(), "password": z.coerce.string().describe("The password for login in clear text").optional() }).optional();
/**
 * @description successful operation
 */
export const loginUser200Schema = z.coerce.string();
/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any();
/**
 * @description successful operation
 */
export const loginUserQueryResponseSchema = z.coerce.string();