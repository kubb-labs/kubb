import { addPetHandler } from './petHandlers/addPetHandler'
import { deletePetHandler } from './petHandlers/deletePetHandler'
import { findPetsByStatusHandler } from './petHandlers/findPetsByStatusHandler'
import { findPetsByTagsHandler } from './petHandlers/findPetsByTagsHandler'
import { getPetByIdHandler } from './petHandlers/getPetByIdHandler'
import { updatePetHandler } from './petHandlers/updatePetHandler'
import { updatePetWithFormHandler } from './petHandlers/updatePetWithFormHandler'
import { uploadFileHandler } from './petHandlers/uploadFileHandler'
import { deleteOrderHandler } from './storeHandlers/deleteOrderHandler'
import { getInventoryHandler } from './storeHandlers/getInventoryHandler'
import { getOrderByIdHandler } from './storeHandlers/getOrderByIdHandler'
import { placeOrderHandler } from './storeHandlers/placeOrderHandler'
import { placeOrderPatchHandler } from './storeHandlers/placeOrderPatchHandler'
import { createUserHandler } from './userHandlers/createUserHandler'
import { createUsersWithListInputHandler } from './userHandlers/createUsersWithListInputHandler'
import { deleteUserHandler } from './userHandlers/deleteUserHandler'
import { getUserByNameHandler } from './userHandlers/getUserByNameHandler'
import { loginUserHandler } from './userHandlers/loginUserHandler'
import { logoutUserHandler } from './userHandlers/logoutUserHandler'
import { updateUserHandler } from './userHandlers/updateUserHandler'

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
