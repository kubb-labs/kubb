import { addPetHandler } from './petController/addPetHandler'
import { deletePetHandler } from './petController/deletePetHandler'
import { findPetsByStatusHandler } from './petController/findPetsByStatusHandler'
import { findPetsByTagsHandler } from './petController/findPetsByTagsHandler'
import { getPetByIdHandler } from './petController/getPetByIdHandler'
import { updatePetHandler } from './petController/updatePetHandler'
import { updatePetWithFormHandler } from './petController/updatePetWithFormHandler'
import { uploadFileHandler } from './petController/uploadFileHandler'
import { createPetsHandler } from './petsController/createPetsHandler'
import { createUserHandler } from './userController/createUserHandler'
import { createUsersWithListInputHandler } from './userController/createUsersWithListInputHandler'
import { deleteUserHandler } from './userController/deleteUserHandler'
import { getUserByNameHandler } from './userController/getUserByNameHandler'
import { loginUserHandler } from './userController/loginUserHandler'
import { logoutUserHandler } from './userController/logoutUserHandler'
import { updateUserHandler } from './userController/updateUserHandler'

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
