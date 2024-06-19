import { z } from "../../zod.ts";


export const petNotFoundSchema = z.object({ "code": z.coerce.number().optional(), "message": z.coerce.string().optional() });