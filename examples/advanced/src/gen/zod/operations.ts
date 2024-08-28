import { addPetMutationRequestSchema, addPetMutationResponseSchema, addPet405Schema } from './petController/addPetSchema.ts'
import { deletePetMutationResponseSchema, deletePet400Schema, deletePetPathParamsSchema, deletePetHeaderParamsSchema } from './petController/deletePetSchema.ts'
import { findPetsByStatusQueryResponseSchema, findPetsByStatus400Schema, findPetsByStatusQueryParamsSchema } from './petController/findPetsByStatusSchema.ts'
import {
  findPetsByTagsQueryResponseSchema,
  findPetsByTags400Schema,
  findPetsByTagsQueryParamsSchema,
  findPetsByTagsHeaderParamsSchema,
} from './petController/findPetsByTagsSchema.ts'
import { getPetByIdQueryResponseSchema, getPetById400Schema, getPetById404Schema, getPetByIdPathParamsSchema } from './petController/getPetByIdSchema.ts'
import {
  updatePetMutationRequestSchema,
  updatePetMutationResponseSchema,
  updatePet400Schema,
  updatePet404Schema,
  updatePet405Schema,
} from './petController/updatePetSchema.ts'
import {
  updatePetWithFormMutationResponseSchema,
  updatePetWithForm405Schema,
  updatePetWithFormPathParamsSchema,
  updatePetWithFormQueryParamsSchema,
} from './petController/updatePetWithFormSchema.ts'
import {
  uploadFileMutationRequestSchema,
  uploadFileMutationResponseSchema,
  uploadFilePathParamsSchema,
  uploadFileQueryParamsSchema,
} from './petController/uploadFileSchema.ts'
import {
  createPetsMutationRequestSchema,
  createPetsMutationResponseSchema,
  createPetsPathParamsSchema,
  createPetsQueryParamsSchema,
  createPetsHeaderParamsSchema,
} from './petsController/createPetsSchema.ts'
import { createUserMutationRequestSchema, createUserMutationResponseSchema } from './userController/createUserSchema.ts'
import {
  createUsersWithListInputMutationRequestSchema,
  createUsersWithListInputMutationResponseSchema,
} from './userController/createUsersWithListInputSchema.ts'
import { deleteUserMutationResponseSchema, deleteUser400Schema, deleteUser404Schema, deleteUserPathParamsSchema } from './userController/deleteUserSchema.ts'
import {
  getUserByNameQueryResponseSchema,
  getUserByName400Schema,
  getUserByName404Schema,
  getUserByNamePathParamsSchema,
} from './userController/getUserByNameSchema.ts'
import { loginUserQueryResponseSchema, loginUser400Schema, loginUserQueryParamsSchema } from './userController/loginUserSchema.ts'
import { logoutUserQueryResponseSchema } from './userController/logoutUserSchema.ts'
import { updateUserMutationRequestSchema, updateUserMutationResponseSchema, updateUserPathParamsSchema } from './userController/updateUserSchema.ts'

export const operations = {
  createPets: {
    request: createPetsMutationRequestSchema,
    parameters: {
      path: createPetsPathParamsSchema,
      query: createPetsQueryParamsSchema,
      header: createPetsHeaderParamsSchema,
    },
    responses: {
      201: createPetsMutationResponseSchema,
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
      200: updatePetMutationResponseSchema,
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
      200: addPetMutationResponseSchema,
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
      200: findPetsByStatusQueryResponseSchema,
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
      200: findPetsByTagsQueryResponseSchema,
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
      200: getPetByIdQueryResponseSchema,
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
      200: updatePetWithFormMutationResponseSchema,
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
      200: deletePetMutationResponseSchema,
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
      200: uploadFileMutationResponseSchema,
      default: uploadFileMutationResponseSchema,
    },
    errors: {},
  },
  createUser: {
    request: createUserMutationRequestSchema,
    parameters: {
      path: undefined,
      query: undefined,
      header: undefined,
    },
    responses: {
      200: createUserMutationResponseSchema,
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
      200: createUsersWithListInputMutationResponseSchema,
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
      200: loginUserQueryResponseSchema,
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
      200: logoutUserQueryResponseSchema,
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
      200: getUserByNameQueryResponseSchema,
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
      200: updateUserMutationResponseSchema,
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
      200: deleteUserMutationResponseSchema,
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
