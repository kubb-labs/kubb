/* eslint-disable no-alert, no-console */
import { createUser } from './createUser.js'
import { createUsersWithListInput } from './createUsersWithListInput.js'
import { deleteUser } from './deleteUser.js'
import { getUserByName } from './getUserByName.js'
import { loginUser } from './loginUser.js'
import { logoutUser } from './logoutUser.js'
import { updateUser } from './updateUser.js'

export function userService() {
  return { createUser, createUsersWithListInput, loginUser, logoutUser, getUserByName, updateUser, deleteUser }
}
