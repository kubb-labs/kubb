import { userSchema } from "./userSchema";
import { z } from "zod";


export const userArraySchema = z.array(z.lazy(() => userSchema));