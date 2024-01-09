import { z } from "zod";

export const petNotFoundSchema = z.object({"code": z.number().optional(),"message": z.string().optional()});