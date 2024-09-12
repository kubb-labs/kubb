import { z } from "zod";

 export const enumVarNamesType = z.union([z.literal(0), z.literal(1)]);
