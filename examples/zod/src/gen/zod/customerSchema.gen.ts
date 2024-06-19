import { addressSchema } from "./addressSchema.gen";
import { z } from "../../zod.ts";


export const customerSchema = z.object({ "id": z.coerce.number().optional(), "username": z.coerce.string().optional(), "address": z.array(z.lazy(() => addressSchema)).optional() });