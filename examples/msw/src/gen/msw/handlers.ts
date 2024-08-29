import { addPetHandler } from './petHandlers/addPetHandler.ts'
import { deletePetHandler } from './petHandlers/deletePetHandler.ts'
import { findPetsByStatusHandler } from './petHandlers/findPetsByStatusHandler.ts'
import { findPetsByTagsHandler } from './petHandlers/findPetsByTagsHandler.ts'
import { getPetByIdHandler } from './petHandlers/getPetByIdHandler.ts'
import { optionsFindPetsByStatusHandler } from './petHandlers/optionsFindPetsByStatusHandler.ts'
import { updatePetHandler } from './petHandlers/updatePetHandler.ts'
import { updatePetWithFormHandler } from './petHandlers/updatePetWithFormHandler.ts'
import { uploadFileHandler } from './petHandlers/uploadFileHandler.ts'
import { deleteOrderHandler } from './storeHandlers/deleteOrderHandler.ts'
import { getInventoryHandler } from './storeHandlers/getInventoryHandler.ts'
import { getOrderByIdHandler } from './storeHandlers/getOrderByIdHandler.ts'
import { placeOrderHandler } from './storeHandlers/placeOrderHandler.ts'
import { placeOrderPatchHandler } from './storeHandlers/placeOrderPatchHandler.ts'
import { createUserHandler } from './userHandlers/createUserHandler.ts'
import { createUsersWithListInputHandler } from './userHandlers/createUsersWithListInputHandler.ts'
import { deleteUserHandler } from './userHandlers/deleteUserHandler.ts'
import { getUserByNameHandler } from './userHandlers/getUserByNameHandler.ts'
import { loginUserHandler } from './userHandlers/loginUserHandler.ts'
import { logoutUserHandler } from './userHandlers/logoutUserHandler.ts'
import { updateUserHandler } from './userHandlers/updateUserHandler.ts'

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
