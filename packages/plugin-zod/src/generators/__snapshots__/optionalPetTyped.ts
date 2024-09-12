import { z } from "zod";

 export const optionalPet = z.object({ "id": z.number().int().optional(), "name": z.string().optional(), "tag": z.string().optional() }) as z.ZodType<OptionalPet>;
