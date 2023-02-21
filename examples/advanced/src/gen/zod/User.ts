import zod from 'zod'

export const User = zod.object({
  id: zod.number().optional(),
  username: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
  email: zod.string().optional(),
  password: zod.string().optional(),
  phone: zod.string().optional(),
  userStatus: zod.number().describe('User Status').optional(),
})
