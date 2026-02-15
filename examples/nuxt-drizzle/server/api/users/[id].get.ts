import { db } from '~/server/database'
import { eq } from 'drizzle-orm'
import { users } from '~/server/database/schema'

/**
 * Get user by ID
 * 
 * Example: GET /api/users/1
 */
export default eventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  })
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }
  
  return user
})
