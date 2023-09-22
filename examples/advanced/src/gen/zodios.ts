import { makeApi, Zodios } from '@zodios/core'
import {
  createPetsMutationResponseSchema,
  createPetsPathParamsSchema,
  createpetsQueryparamsSchema,
  createpets201schema,
} from './zod/petsController/createPetsSchema'
import { addPetMutationResponseSchema, addpet405schema } from './zod/petController/addPetSchema'
import { updatePetMutationResponseSchema, updatepet400schema, updatepet404schema, updatepet405schema } from './zod/petController/updatePetSchema'
import { findPetsByStatusQueryResponseSchema, findpetsbystatusQueryparamsSchema, findpetsbystatus400schema } from './zod/petController/findPetsByStatusSchema'
import { findPetsByTagsQueryResponseSchema, findpetsbytagsQueryparamsSchema, findpetsbytags400schema } from './zod/petController/findPetsByTagsSchema'
import { getPetByIdQueryResponseSchema, getPetByIdPathParamsSchema, getpetbyid400schema, getpetbyid404schema } from './zod/petController/getPetByIdSchema'
import {
  updatePetWithFormMutationResponseSchema,
  updatePetWithFormPathParamsSchema,
  updatepetwithformQueryparamsSchema,
  updatepetwithform405schema,
} from './zod/petController/updatePetWithFormSchema'
import { deletePetMutationResponseSchema, deletePetPathParamsSchema, deletepet400schema } from './zod/petController/deletePetSchema'
import { uploadFileMutationResponseSchema, uploadFilePathParamsSchema, uploadfileQueryparamsSchema } from './zod/petController/uploadFileSchema'
import { createUserMutationResponseSchema } from './zod/userController/createUserSchema'
import { createUsersWithListInputMutationResponseSchema } from './zod/userController/createUsersWithListInputSchema'
import { loginUserQueryResponseSchema, loginuserQueryparamsSchema, loginuser400schema } from './zod/userController/loginUserSchema'
import { logoutUserQueryResponseSchema } from './zod/userController/logoutUserSchema'
import {
  getUserByNameQueryResponseSchema,
  getUserByNamePathParamsSchema,
  getuserbyname400schema,
  getuserbyname404schema,
} from './zod/userController/getUserByNameSchema'
import { updateUserMutationResponseSchema, updateUserPathParamsSchema } from './zod/userController/updateUserSchema'
import { deleteUserMutationResponseSchema, deleteUserPathParamsSchema, deleteuser400schema, deleteuser404schema } from './zod/userController/deleteUserSchema'

const endpoints = makeApi([
  {
    method: 'post',
    path: '/pets/:uuid',
    description: ``,
    requestFormat: 'json',
    parameters: [
      {
        name: 'CreatePetsPathParams',
        description: ``,
        type: 'Path',
        schema: createPetsPathParamsSchema,
      },
      {
        name: 'CreatepetsQueryparams',
        description: ``,
        type: 'Query',
        schema: createpetsQueryparamsSchema,
      },
    ],
    response: createPetsMutationResponseSchema,
    errors: [
      {
        status: 201,
        description: `Null response`,
        schema: createpets201schema,
      },
    ],
  },
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
        description: ``,
        schema: addpet405schema,
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
        schema: updatepet400schema,
      },
      {
        status: 404,
        description: `Pet not found`,
        schema: updatepet404schema,
      },
      {
        status: 405,
        description: `Validation exception`,
        schema: updatepet405schema,
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
        name: 'FindpetsbystatusQueryparams',
        description: ``,
        type: 'Query',
        schema: findpetsbystatusQueryparamsSchema,
      },
    ],
    response: findPetsByStatusQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid status value`,
        schema: findpetsbystatus400schema,
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
        name: 'FindpetsbytagsQueryparams',
        description: ``,
        type: 'Query',
        schema: findpetsbytagsQueryparamsSchema,
      },
    ],
    response: findPetsByTagsQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid tag value`,
        schema: findpetsbytags400schema,
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
        schema: getpetbyid400schema,
      },
      {
        status: 404,
        description: `Pet not found`,
        schema: getpetbyid404schema,
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
        name: 'UpdatepetwithformQueryparams',
        description: ``,
        type: 'Query',
        schema: updatepetwithformQueryparamsSchema,
      },
    ],
    response: updatePetWithFormMutationResponseSchema,
    errors: [
      {
        status: 405,
        description: `Invalid input`,
        schema: updatepetwithform405schema,
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
        schema: deletepet400schema,
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
        name: 'UploadfileQueryparams',
        description: ``,
        type: 'Query',
        schema: uploadfileQueryparamsSchema,
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
        name: 'LoginuserQueryparams',
        description: ``,
        type: 'Query',
        schema: loginuserQueryparamsSchema,
      },
    ],
    response: loginUserQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid username/password supplied`,
        schema: loginuser400schema,
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
        schema: getuserbyname400schema,
      },
      {
        status: 404,
        description: `User not found`,
        schema: getuserbyname404schema,
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
        schema: deleteuser400schema,
      },
      {
        status: 404,
        description: `User not found`,
        schema: deleteuser404schema,
      },
    ],
  },
])

export const api = new Zodios(endpoints)

export default api
