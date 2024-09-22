import { z } from "zod";

 export const enumBooleanLiteral = z.union([z.literal(true), z.literal(false)]);
