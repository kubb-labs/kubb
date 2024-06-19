import { z } from "../../zod.ts";


export const apiResponseSchema = z.object({ "code": z.coerce.number().optional(), "type": z.coerce.string().optional(), "message": z.coerce.string().optional() });