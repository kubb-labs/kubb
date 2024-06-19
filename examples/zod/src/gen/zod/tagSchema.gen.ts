import { z } from "../../zod.ts";


export const tagSchema = z.object({ "id": z.coerce.number().optional(), "name": z.coerce.string().optional() });