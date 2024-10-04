import { z } from "zod";

 export const pet = z.object({ "id": z.number().int(), "name": z.coerce.string(), "date": z.date().optional(), "tag": z.coerce.string().min(5).max(100).optional() });
