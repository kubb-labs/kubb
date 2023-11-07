import { addPetHandler } from './petHandlers/addPetHandler.ts'
import { updatePetHandler } from './petHandlers/updatePetHandler.ts'
import { findPetsByStatusHandler } from './petHandlers/findPetsByStatusHandler.ts'
import { findPetsByTagsHandler } from './petHandlers/findPetsByTagsHandler.ts'
import { getPetByIdHandler } from './petHandlers/getPetByIdHandler.ts'
import { updatePetWithFormHandler } from './petHandlers/updatePetWithFormHandler.ts'
import { deletePetHandler } from './petHandlers/deletePetHandler.ts'
import { uploadFileHandler } from './petHandlers/uploadFileHandler.ts'
import { getInventoryHandler } from './storeHandlers/getInventoryHandler.ts'
import { placeOrderHandler } from './storeHandlers/placeOrderHandler.ts'
import { placeOrderPatchHandler } from './storeHandlers/placeOrderPatchHandler.ts'
import { getOrderByIdHandler } from './storeHandlers/getOrderByIdHandler.ts'
import { deleteOrderHandler } from './storeHandlers/deleteOrderHandler.ts'
import { createUserHandler } from './userHandlers/createUserHandler.ts'
import { createUsersWithListInputHandler } from './userHandlers/createUsersWithListInputHandler.ts'
import { loginUserHandler } from './userHandlers/loginUserHandler.ts'
import { logoutUserHandler } from './userHandlers/logoutUserHandler.ts'
import { getUserByNameHandler } from './userHandlers/getUserByNameHandler.ts'
import { updateUserHandler } from './userHandlers/updateUserHandler.ts'
import { deleteUserHandler } from './userHandlers/deleteUserHandler.ts'

export const handlers = [
  addPetHandler,
  updatePetHandler,
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
