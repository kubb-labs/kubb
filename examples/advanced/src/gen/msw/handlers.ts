import { addPetHandler } from './petController/addPetHandler'
import { updatePetHandler } from './petController/updatePetHandler'
import { findPetsByStatusHandler } from './petController/findPetsByStatusHandler'
import { findPetsByTagsHandler } from './petController/findPetsByTagsHandler'
import { getPetByIdHandler } from './petController/getPetByIdHandler'
import { updatePetWithFormHandler } from './petController/updatePetWithFormHandler'
import { deletePetHandler } from './petController/deletePetHandler'
import { uploadFileHandler } from './petController/uploadFileHandler'
import { createUserHandler } from './userController/createUserHandler'
import { createUsersWithListInputHandler } from './userController/createUsersWithListInputHandler'
import { loginUserHandler } from './userController/loginUserHandler'
import { logoutUserHandler } from './userController/logoutUserHandler'
import { getUserByNameHandler } from './userController/getUserByNameHandler'
import { updateUserHandler } from './userController/updateUserHandler'
import { deleteUserHandler } from './userController/deleteUserHandler'

export const handlers = [
  addPetHandler,
  updatePetHandler,
  findPetsByStatusHandler,
  findPetsByTagsHandler,
  getPetByIdHandler,
  updatePetWithFormHandler,
  deletePetHandler,
  uploadFileHandler,
  createUserHandler,
  createUsersWithListInputHandler,
  loginUserHandler,
  logoutUserHandler,
  getUserByNameHandler,
  updateUserHandler,
  deleteUserHandler,
] as const
