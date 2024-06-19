import { z } from "zod";


export const userSchema = z.object({ "id": z.coerce.number().optional(), "username": z.coerce.string().optional(), "firstName": z.coerce.string().optional(), "lastName": z.coerce.string().optional(), "email": z.coerce.string().optional(), "password": z.coerce.string().optional(), "phone": z.coerce.string().optional(), "userStatus": z.coerce.number().describe("User Status").optional() });