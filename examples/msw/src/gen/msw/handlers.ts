import { addPetHandler } from './pet/Handlers/addPetHandler.ts'
import { deletePetHandler } from './pet/Handlers/deletePetHandler.ts'
import { findPetsByStatusHandler } from './pet/Handlers/findPetsByStatusHandler.ts'
import { findPetsByTagsHandler } from './pet/Handlers/findPetsByTagsHandler.ts'
import { getPetByIdHandler } from './pet/Handlers/getPetByIdHandler.ts'
import { optionsFindPetsByStatusHandler } from './pet/Handlers/optionsFindPetsByStatusHandler.ts'
import { updatePetHandler } from './pet/Handlers/updatePetHandler.ts'
import { updatePetWithFormHandler } from './pet/Handlers/updatePetWithFormHandler.ts'
import { uploadFileHandler } from './pet/Handlers/uploadFileHandler.ts'
import { deleteOrderHandler } from './store/Handlers/deleteOrderHandler.ts'
import { getInventoryHandler } from './store/Handlers/getInventoryHandler.ts'
import { getOrderByIdHandler } from './store/Handlers/getOrderByIdHandler.ts'
import { placeOrderHandler } from './store/Handlers/placeOrderHandler.ts'
import { placeOrderPatchHandler } from './store/Handlers/placeOrderPatchHandler.ts'
import { createUserHandler } from './user/Handlers/createUserHandler.ts'
import { createUsersWithListInputHandler } from './user/Handlers/createUsersWithListInputHandler.ts'
import { deleteUserHandler } from './user/Handlers/deleteUserHandler.ts'
import { getUserByNameHandler } from './user/Handlers/getUserByNameHandler.ts'
import { loginUserHandler } from './user/Handlers/loginUserHandler.ts'
import { logoutUserHandler } from './user/Handlers/logoutUserHandler.ts'
import { updateUserHandler } from './user/Handlers/updateUserHandler.ts'

export const handlers = [
  updatePetHandler,
  addPetHandler,
  optionsFindPetsByStatusHandler,
  findPetsByStatusHandler,
  findPetsByTagsHandler,
  getPetByIdHandler,
  updatePetWithFormHandler,
  deletePetHandler,
  uploadFileHandler,
  getInventoryHandler,
  placeOrderHandler,
  placeOrderPatchHandler,
  getOrderByIdHandler,
  deleteOrderHandler,
  createUserHandler,
  createUsersWithListInputHandler,
  loginUserHandler,
  logoutUserHandler,
  getUserByNameHandler,
  updateUserHandler,
  deleteUserHandler,
] as const
