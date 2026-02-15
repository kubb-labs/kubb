import { db, schema } from '~/server/database'
import { eq } from 'drizzle-orm'

/**
 * Delete user
 * 
 * Example: DELETE /api/users/1
 */
export default eventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  
  const [user] = await db
    .delete(schema.users)
    .where(eq(schema.users.id, id))
    .returning()
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }
  
  return user
})
