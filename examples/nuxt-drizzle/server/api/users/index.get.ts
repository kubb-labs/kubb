import { db } from '~/server/database'

/**
 * Get all users
 * 
 * Example: GET /api/users
 */
export default eventHandler(async (event) => {
  const users = await db.query.users.findMany()
  return users
})
