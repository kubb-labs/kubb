import { makeApi, Zodios } from '@zodios/core'
import { addPetMutationResponseSchema, addPet405Schema } from './zod/petController/addPetSchema'
import { updatePetMutationResponseSchema, updatePet400Schema, updatePet404Schema, updatePet405Schema } from './zod/petController/updatePetSchema'
import { findPetsByStatusQueryResponseSchema, findPetsByStatusQueryParamsSchema, findPetsByStatus400Schema } from './zod/petController/findPetsByStatusSchema'
import { findPetsByTagsQueryResponseSchema, findPetsByTagsQueryParamsSchema, findPetsByTags400Schema } from './zod/petController/findPetsByTagsSchema'
import { getPetByIdQueryResponseSchema, getPetByIdPathParamsSchema, getPetById400Schema, getPetById404Schema } from './zod/petController/getPetByIdSchema'
import {
  updatePetWithFormMutationResponseSchema,
  updatePetWithFormPathParamsSchema,
  updatePetWithFormQueryParamsSchema,
  updatePetWithForm405Schema,
} from './zod/petController/updatePetWithFormSchema'
import { deletePetMutationResponseSchema, deletePetPathParamsSchema, deletePet400Schema } from './zod/petController/deletePetSchema'
import { uploadFileMutationResponseSchema, uploadFilePathParamsSchema, uploadFileQueryParamsSchema } from './zod/petController/uploadFileSchema'
import { createUserMutationResponseSchema } from './zod/userController/createUserSchema'
import { createUsersWithListInputMutationResponseSchema } from './zod/userController/createUsersWithListInputSchema'
import { loginUserQueryResponseSchema, loginUserQueryParamsSchema, loginUser400Schema } from './zod/userController/loginUserSchema'
import { logoutUserQueryResponseSchema } from './zod/userController/logoutUserSchema'
import {
  getUserByNameQueryResponseSchema,
  getUserByNamePathParamsSchema,
  getUserByName400Schema,
  getUserByName404Schema,
} from './zod/userController/getUserByNameSchema'
import { updateUserMutationResponseSchema, updateUserPathParamsSchema } from './zod/userController/updateUserSchema'
import { deleteUserMutationResponseSchema, deleteUserPathParamsSchema, deleteUser400Schema, deleteUser404Schema } from './zod/userController/deleteUserSchema'

const endpoints = makeApi([
  {
    method: 'post',
    path: '/pet',
    description: `Add a new pet to the store`,
    requestFormat: 'json',
    parameters: [],
    response: addPetMutationResponseSchema,
    errors: [
      {
        status: 405,
        description: `Invalid input`,
        schema: addPet405Schema,
      },
    ],
  },
  {
    method: 'put',
    path: '/pet',
    description: `Update an existing pet by Id`,
    requestFormat: 'json',
    parameters: [],
    response: updatePetMutationResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid ID supplied`,
        schema: updatePet400Schema,
      },
      {
        status: 404,
        description: `Pet not found`,
        schema: updatePet404Schema,
      },
      {
        status: 405,
        description: `Validation exception`,
        schema: updatePet405Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/pet/findByStatus',
    description: `Multiple status values can be provided with comma separated strings`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'FindPetsByStatusQueryParams',
        description: ``,
        type: 'Query',
        schema: findPetsByStatusQueryParamsSchema,
      },
    ],
    response: findPetsByStatusQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid status value`,
        schema: findPetsByStatus400Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/pet/findByTags',
    description: `Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'FindPetsByTagsQueryParams',
        description: ``,
        type: 'Query',
        schema: findPetsByTagsQueryParamsSchema,
      },
    ],
    response: findPetsByTagsQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid tag value`,
        schema: findPetsByTags400Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/pet/:petId',
    description: `Returns a single pet`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'GetPetByIdPathParams',
        description: ``,
        type: 'Path',
        schema: getPetByIdPathParamsSchema,
      },
    ],
    response: getPetByIdQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid ID supplied`,
        schema: getPetById400Schema,
      },
      {
        status: 404,
        description: `Pet not found`,
        schema: getPetById404Schema,
      },
    ],
  },
  {
    method: 'post',
    path: '/pet/:petId',
    description: ``,
    requestFormat: 'json',
    parameters: [
      {
        name: 'UpdatePetWithFormPathParams',
        description: ``,
        type: 'Path',
        schema: updatePetWithFormPathParamsSchema,
      },
      {
        name: 'UpdatePetWithFormQueryParams',
        description: ``,
        type: 'Query',
        schema: updatePetWithFormQueryParamsSchema,
      },
    ],
    response: updatePetWithFormMutationResponseSchema,
    errors: [
      {
        status: 405,
        description: `Invalid input`,
        schema: updatePetWithForm405Schema,
      },
    ],
  },
  {
    method: 'delete',
    path: '/pet/:petId',
    description: `delete a pet`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'DeletePetPathParams',
        description: ``,
        type: 'Path',
        schema: deletePetPathParamsSchema,
      },
    ],
    response: deletePetMutationResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid pet value`,
        schema: deletePet400Schema,
      },
    ],
  },
  {
    method: 'post',
    path: '/pet/:petId/uploadImage',
    description: ``,
    requestFormat: 'json',
    parameters: [
      {
        name: 'UploadFilePathParams',
        description: ``,
        type: 'Path',
        schema: uploadFilePathParamsSchema,
      },
      {
        name: 'UploadFileQueryParams',
        description: ``,
        type: 'Query',
        schema: uploadFileQueryParamsSchema,
      },
    ],
    response: uploadFileMutationResponseSchema,
    errors: [],
  },
  {
    method: 'post',
    path: '/user',
    description: `This can only be done by the logged in user.`,
    requestFormat: 'json',
    parameters: [],
    response: createUserMutationResponseSchema,
    errors: [],
  },
  {
    method: 'post',
    path: '/user/createWithList',
    description: `Creates list of users with given input array`,
    requestFormat: 'json',
    parameters: [],
    response: createUsersWithListInputMutationResponseSchema,
    errors: [],
  },
  {
    method: 'get',
    path: '/user/login',
    description: ``,
    requestFormat: 'json',
    parameters: [
      {
        name: 'LoginUserQueryParams',
        description: ``,
        type: 'Query',
        schema: loginUserQueryParamsSchema,
      },
    ],
    response: loginUserQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid username/password supplied`,
        schema: loginUser400Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/user/logout',
    description: ``,
    requestFormat: 'json',
    parameters: [],
    response: logoutUserQueryResponseSchema,
    errors: [],
  },
  {
    method: 'get',
    path: '/user/:username',
    description: ``,
    requestFormat: 'json',
    parameters: [
      {
        name: 'GetUserByNamePathParams',
        description: ``,
        type: 'Path',
        schema: getUserByNamePathParamsSchema,
      },
    ],
    response: getUserByNameQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid username supplied`,
        schema: getUserByName400Schema,
      },
      {
        status: 404,
        description: `User not found`,
        schema: getUserByName404Schema,
      },
    ],
  },
  {
    method: 'put',
    path: '/user/:username',
    description: `This can only be done by the logged in user.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'UpdateUserPathParams',
        description: ``,
        type: 'Path',
        schema: updateUserPathParamsSchema,
      },
    ],
    response: updateUserMutationResponseSchema,
    errors: [],
  },
  {
    method: 'delete',
    path: '/user/:username',
    description: `This can only be done by the logged in user.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'DeleteUserPathParams',
        description: ``,
        type: 'Path',
        schema: deleteUserPathParamsSchema,
      },
    ],
    response: deleteUserMutationResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid username supplied`,
        schema: deleteUser400Schema,
      },
      {
        status: 404,
        description: `User not found`,
        schema: deleteUser404Schema,
      },
    ],
  },
])

export const api = new Zodios(endpoints)

export default api
