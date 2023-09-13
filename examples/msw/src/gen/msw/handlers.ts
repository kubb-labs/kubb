import { addPetHandler } from './petHandlers/addPetHandler'
import { updatePetHandler } from './petHandlers/updatePetHandler'
import { findPetsByStatusHandler } from './petHandlers/findPetsByStatusHandler'
import { findPetsByTagsHandler } from './petHandlers/findPetsByTagsHandler'
import { getPetByIdHandler } from './petHandlers/getPetByIdHandler'
import { updatePetWithFormHandler } from './petHandlers/updatePetWithFormHandler'
import { deletePetHandler } from './petHandlers/deletePetHandler'
import { uploadFileHandler } from './petHandlers/uploadFileHandler'
import { getInventoryHandler } from './storeHandlers/getInventoryHandler'
import { placeOrderHandler } from './storeHandlers/placeOrderHandler'
import { getOrderByIdHandler } from './storeHandlers/getOrderByIdHandler'
import { deleteOrderHandler } from './storeHandlers/deleteOrderHandler'
import { createUserHandler } from './userHandlers/createUserHandler'
import { createUsersWithListInputHandler } from './userHandlers/createUsersWithListInputHandler'
import { loginUserHandler } from './userHandlers/loginUserHandler'
import { logoutUserHandler } from './userHandlers/logoutUserHandler'
import { getUserByNameHandler } from './userHandlers/getUserByNameHandler'
import { updateUserHandler } from './userHandlers/updateUserHandler'
import { deleteUserHandler } from './userHandlers/deleteUserHandler'

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
