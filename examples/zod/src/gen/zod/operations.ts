import { addPetMutationRequestSchema, addPet200Schema, addPet405Schema, addPetMutationResponseSchema } from './addPetSchema.gen.ts'
import {
  createPetsMutationRequestSchema,
  createPets201Schema,
  createPetsMutationResponseSchema,
  createPetsPathParamsSchema,
  createPetsQueryParamsSchema,
  createPetsHeaderParamsSchema,
} from './createPetsSchema.gen.ts'
import { createUserMutationRequestSchema, createUserMutationResponseSchema } from './createUserSchema.gen.ts'
import {
  createUsersWithListInputMutationRequestSchema,
  createUsersWithListInput200Schema,
  createUsersWithListInputMutationResponseSchema,
} from './createUsersWithListInputSchema.gen.ts'
import { deleteOrder400Schema, deleteOrder404Schema, deleteOrderMutationResponseSchema, deleteOrderPathParamsSchema } from './deleteOrderSchema.gen.ts'
import { deletePet400Schema, deletePetMutationResponseSchema, deletePetPathParamsSchema, deletePetHeaderParamsSchema } from './deletePetSchema.gen.ts'
import { deleteUser400Schema, deleteUser404Schema, deleteUserMutationResponseSchema, deleteUserPathParamsSchema } from './deleteUserSchema.gen.ts'
import {
  findPetsByStatus200Schema,
  findPetsByStatus400Schema,
  findPetsByStatusQueryResponseSchema,
  findPetsByStatusQueryParamsSchema,
} from './findPetsByStatusSchema.gen.ts'
import {
  findPetsByTags200Schema,
  findPetsByTags400Schema,
  findPetsByTagsQueryResponseSchema,
  findPetsByTagsQueryParamsSchema,
  findPetsByTagsHeaderParamsSchema,
} from './findPetsByTagsSchema.gen.ts'
import { getInventory200Schema, getInventoryQueryResponseSchema } from './getInventorySchema.gen.ts'
import {
  getOrderById200Schema,
  getOrderById400Schema,
  getOrderById404Schema,
  getOrderByIdQueryResponseSchema,
  getOrderByIdPathParamsSchema,
} from './getOrderByIdSchema.gen.ts'
import {
  getPetById200Schema,
  getPetById400Schema,
  getPetById404Schema,
  getPetByIdQueryResponseSchema,
  getPetByIdPathParamsSchema,
} from './getPetByIdSchema.gen.ts'
import {
  getUserByName200Schema,
  getUserByName400Schema,
  getUserByName404Schema,
  getUserByNameQueryResponseSchema,
  getUserByNamePathParamsSchema,
} from './getUserByNameSchema.gen.ts'
import { loginUser200Schema, loginUser400Schema, loginUserQueryResponseSchema, loginUserQueryParamsSchema } from './loginUserSchema.gen.ts'
import { logoutUserQueryResponseSchema } from './logoutUserSchema.gen.ts'
import {
  placeOrderPatchMutationRequestSchema,
  placeOrderPatch200Schema,
  placeOrderPatch405Schema,
  placeOrderPatchMutationResponseSchema,
} from './placeOrderPatchSchema.gen.ts'
import { placeOrderMutationRequestSchema, placeOrder200Schema, placeOrder405Schema, placeOrderMutationResponseSchema } from './placeOrderSchema.gen.ts'
import {
  updatePetMutationRequestSchema,
  updatePet200Schema,
  updatePet400Schema,
  updatePet404Schema,
  updatePet405Schema,
  updatePetMutationResponseSchema,
} from './updatePetSchema.gen.ts'
import {
  updatePetWithForm405Schema,
  updatePetWithFormMutationResponseSchema,
  updatePetWithFormPathParamsSchema,
  updatePetWithFormQueryParamsSchema,
} from './updatePetWithFormSchema.gen.ts'
import { updateUserMutationRequestSchema, updateUserMutationResponseSchema, updateUserPathParamsSchema } from './updateUserSchema.gen.ts'
import {
  uploadFileMutationRequestSchema,
  uploadFile200Schema,
  uploadFileMutationResponseSchema,
  uploadFilePathParamsSchema,
  uploadFileQueryParamsSchema,
} from './uploadFileSchema.gen.ts'

export const operations = {
  createPets: {
    request: createPetsMutationRequestSchema,
    parameters: {
      path: createPetsPathParamsSchema,
      query: createPetsQueryParamsSchema,
      header: createPetsHeaderParamsSchema,
    },
    responses: {
      201: createPets201Schema,
      default: createPetsMutationResponseSchema,
    },
    errors: {},
  },
  updatePet: {
    request: updatePetMutationRequestSchema,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: updatePet200Schema,
      400: updatePet400Schema,
      404: updatePet404Schema,
      405: updatePet405Schema,
      default: updatePetMutationResponseSchema,
    },
    errors: {
      400: updatePet400Schema,
      404: updatePet404Schema,
      405: updatePet405Schema,
    },
  },
  addPet: {
    request: addPetMutationRequestSchema,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: addPet200Schema,
      405: addPet405Schema,
      default: addPetMutationResponseSchema,
    },
    errors: {
      405: addPet405Schema,
    },
  },
  findPetsByStatus: {
    request: undefined,
    parameters: {
      path: undefined,
      query: findPetsByStatusQueryParamsSchema,
      header: undefined,
    },
    responses: {
      200: findPetsByStatus200Schema,
      400: findPetsByStatus400Schema,
      default: findPetsByStatusQueryResponseSchema,
    },
    errors: {
      400: findPetsByStatus400Schema,
    },
  },
  findPetsByTags: {
    request: undefined,
    parameters: {
      path: undefined,
      query: findPetsByTagsQueryParamsSchema,
      header: findPetsByTagsHeaderParamsSchema,
    },
    responses: {
      200: findPetsByTags200Schema,
      400: findPetsByTags400Schema,
      default: findPetsByTagsQueryResponseSchema,
    },
    errors: {
      400: findPetsByTags400Schema,
    },
  },
  getPetById: {
    request: undefined,
    parameters: {
      path: getPetByIdPathParamsSchema,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: getPetById200Schema,
      400: getPetById400Schema,
      404: getPetById404Schema,
      default: getPetByIdQueryResponseSchema,
    },
    errors: {
      400: getPetById400Schema,
      404: getPetById404Schema,
    },
  },
  updatePetWithForm: {
    request: undefined,
    parameters: {
      path: updatePetWithFormPathParamsSchema,
      query: updatePetWithFormQueryParamsSchema,
      header: undefined,
    },
    responses: {
      405: updatePetWithForm405Schema,
      default: updatePetWithFormMutationResponseSchema,
    },
    errors: {
      405: updatePetWithForm405Schema,
    },
  },
  deletePet: {
    request: undefined,
    parameters: {
      path: deletePetPathParamsSchema,
      query: undefined,
      header: deletePetHeaderParamsSchema,
    },
    responses: {
      400: deletePet400Schema,
      default: deletePetMutationResponseSchema,
    },
    errors: {
      400: deletePet400Schema,
    },
  },
  uploadFile: {
    request: uploadFileMutationRequestSchema,
    parameters: {
      path: uploadFilePathParamsSchema,
      query: uploadFileQueryParamsSchema,
      header: undefined,
    },
    responses: {
      200: uploadFile200Schema,
      default: uploadFileMutationResponseSchema,
    },
    errors: {},
  },
  getInventory: {
    request: undefined,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: getInventory200Schema,
      default: getInventoryQueryResponseSchema,
    },
    errors: {},
  },
  placeOrder: {
    request: placeOrderMutationRequestSchema,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: placeOrder200Schema,
      405: placeOrder405Schema,
      default: placeOrderMutationResponseSchema,
    },
    errors: {
      405: placeOrder405Schema,
    },
  },
  placeOrderPatch: {
    request: placeOrderPatchMutationRequestSchema,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: placeOrderPatch200Schema,
      405: placeOrderPatch405Schema,
      default: placeOrderPatchMutationResponseSchema,
    },
    errors: {
      405: placeOrderPatch405Schema,
    },
  },
  getOrderById: {
    request: undefined,
    parameters: {
      path: getOrderByIdPathParamsSchema,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: getOrderById200Schema,
      400: getOrderById400Schema,
      404: getOrderById404Schema,
      default: getOrderByIdQueryResponseSchema,
    },
    errors: {
      400: getOrderById400Schema,
      404: getOrderById404Schema,
    },
  },
  deleteOrder: {
    request: undefined,
    parameters: {
      path: deleteOrderPathParamsSchema,
      query: undefined,
      header: undefined,
    },
    responses: {
      400: deleteOrder400Schema,
      404: deleteOrder404Schema,
      default: deleteOrderMutationResponseSchema,
    },
    errors: {
      400: deleteOrder400Schema,
      404: deleteOrder404Schema,
    },
  },
  createUser: {
    request: createUserMutationRequestSchema,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      default: createUserMutationResponseSchema,
    },
    errors: {},
  },
  createUsersWithListInput: {
    request: createUsersWithListInputMutationRequestSchema,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: createUsersWithListInput200Schema,
      default: createUsersWithListInputMutationResponseSchema,
    },
    errors: {},
  },
  loginUser: {
    request: undefined,
    parameters: {
      path: undefined,
      query: loginUserQueryParamsSchema,
      header: undefined,
    },
    responses: {
      200: loginUser200Schema,
      400: loginUser400Schema,
      default: loginUserQueryResponseSchema,
    },
    errors: {
      400: loginUser400Schema,
    },
  },
  logoutUser: {
    request: undefined,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      default: logoutUserQueryResponseSchema,
    },
    errors: {},
  },
  getUserByName: {
    request: undefined,
    parameters: {
      path: getUserByNamePathParamsSchema,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: getUserByName200Schema,
      400: getUserByName400Schema,
      404: getUserByName404Schema,
      default: getUserByNameQueryResponseSchema,
    },
    errors: {
      400: getUserByName400Schema,
      404: getUserByName404Schema,
    },
  },
  updateUser: {
    request: updateUserMutationRequestSchema,
    parameters: {
      path: updateUserPathParamsSchema,
      query: undefined,
      header: undefined,
    },
    responses: {
      default: updateUserMutationResponseSchema,
    },
    errors: {},
  },
  deleteUser: {
    request: undefined,
    parameters: {
      path: deleteUserPathParamsSchema,
      query: undefined,
      header: undefined,
    },
    responses: {
      400: deleteUser400Schema,
      404: deleteUser404Schema,
      default: deleteUserMutationResponseSchema,
    },
    errors: {
      400: deleteUser400Schema,
      404: deleteUser404Schema,
    },
  },
} as const

export const paths = {
  '/pets/{uuid}': {
    post: operations['createPets'],
  },
  '/pet': {
    put: operations['updatePet'],
    post: operations['addPet'],
  },
  '/pet/findByStatus': {
    get: operations['findPetsByStatus'],
  },
  '/pet/findByTags': {
    get: operations['findPetsByTags'],
  },
  '/pet/{petId}': {
    get: operations['getPetById'],
    post: operations['updatePetWithForm'],
    delete: operations['deletePet'],
  },
  '/pet/{petId}/uploadImage': {
    post: operations['uploadFile'],
  },
  '/store/inventory': {
    get: operations['getInventory'],
  },
  '/store/order': {
    post: operations['placeOrder'],
    patch: operations['placeOrderPatch'],
  },
  '/store/order/{orderId}': {
    get: operations['getOrderById'],
    delete: operations['deleteOrder'],
  },
  '/user': {
    post: operations['createUser'],
  },
  '/user/createWithList': {
    post: operations['createUsersWithListInput'],
  },
  '/user/login': {
    get: operations['loginUser'],
  },
  '/user/logout': {
    get: operations['logoutUser'],
  },
  '/user/{username}': {
    get: operations['getUserByName'],
    put: operations['updateUser'],
    delete: operations['deleteUser'],
  },
} as const
