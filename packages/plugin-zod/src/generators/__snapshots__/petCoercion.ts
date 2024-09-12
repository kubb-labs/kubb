import { z } from "zod";

 export const pet = z.object({ "id": z.coerce.number().int(), "name": z.coerce.string(), "date": z.coerce.date().optional(), "tag": z.coerce.string().min(5).max(100).optional() });
