import { addPetHandler } from './petController/addPetHandler.js'
import { deletePetHandler } from './petController/deletePetHandler.js'
import { findPetsByStatusHandler } from './petController/findPetsByStatusHandler.js'
import { findPetsByTagsHandler } from './petController/findPetsByTagsHandler.js'
import { getPetByIdHandler } from './petController/getPetByIdHandler.js'
import { updatePetHandler } from './petController/updatePetHandler.js'
import { updatePetWithFormHandler } from './petController/updatePetWithFormHandler.js'
import { uploadFileHandler } from './petController/uploadFileHandler.js'
import { createPetsHandler } from './petsController/createPetsHandler.js'
import { createUserHandler } from './userController/createUserHandler.js'
import { createUsersWithListInputHandler } from './userController/createUsersWithListInputHandler.js'
import { deleteUserHandler } from './userController/deleteUserHandler.js'
import { getUserByNameHandler } from './userController/getUserByNameHandler.js'
import { loginUserHandler } from './userController/loginUserHandler.js'
import { logoutUserHandler } from './userController/logoutUserHandler.js'
import { updateUserHandler } from './userController/updateUserHandler.js'

export const handlers = [
  createPetsHandler,
  updatePetHandler,
  addPetHandler,
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
