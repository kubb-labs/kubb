import { z } from "zod";

 export const pet = z.object({ "id": z.coerce.number().int(), "name": z.string(), "date": z.date().optional(), "tag": z.string().min(5).max(100).optional() });
