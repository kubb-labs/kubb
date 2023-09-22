import { makeApi, Zodios } from '@zodios/core'
import {
  createPetsMutationResponseSchema,
  createPetsPathParamsSchema,
  createPetsQueryParamsSchema,
  createpets201Schema,
} from './zod/petsController/createpetsSchema'
import { addPetMutationResponseSchema, addpet405Schema } from './zod/petController/addpetSchema'
import { updatePetMutationResponseSchema, updatepet400Schema, updatepet404Schema, updatepet405Schema } from './zod/petController/updatepetSchema'
import { findPetsByStatusQueryResponseSchema, findPetsByStatusQueryParamsSchema, findpetsbystatus400Schema } from './zod/petController/findpetsbystatusSchema'
import { findPetsByTagsQueryResponseSchema, findPetsByTagsQueryParamsSchema, findpetsbytags400Schema } from './zod/petController/findpetsbytagsSchema'
import { getPetByIdQueryResponseSchema, getPetByIdPathParamsSchema, getpetbyid400Schema, getpetbyid404Schema } from './zod/petController/getpetbyidSchema'
import {
  updatePetWithFormMutationResponseSchema,
  updatePetWithFormPathParamsSchema,
  updatePetWithFormQueryParamsSchema,
  updatepetwithform405Schema,
} from './zod/petController/updatepetwithformSchema'
import { deletePetMutationResponseSchema, deletePetPathParamsSchema, deletepet400Schema } from './zod/petController/deletepetSchema'
import { uploadFileMutationResponseSchema, uploadFilePathParamsSchema, uploadFileQueryParamsSchema } from './zod/petController/uploadfileSchema'
import { createUserMutationResponseSchema } from './zod/userController/createuserSchema'
import { createUsersWithListInputMutationResponseSchema } from './zod/userController/createuserswithlistinputSchema'
import { loginUserQueryResponseSchema, loginUserQueryParamsSchema, loginuser400Schema } from './zod/userController/loginuserSchema'
import { logoutUserQueryResponseSchema } from './zod/userController/logoutuserSchema'
import {
  getUserByNameQueryResponseSchema,
  getUserByNamePathParamsSchema,
  getuserbyname400Schema,
  getuserbyname404Schema,
} from './zod/userController/getuserbynameSchema'
import { updateUserMutationResponseSchema, updateUserPathParamsSchema } from './zod/userController/updateuserSchema'
import { deleteUserMutationResponseSchema, deleteUserPathParamsSchema, deleteuser400Schema, deleteuser404Schema } from './zod/userController/deleteuserSchema'

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
        name: 'CreatePetsQueryParams',
        description: ``,
        type: 'Query',
        schema: createPetsQueryParamsSchema,
      },
    ],
    response: createPetsMutationResponseSchema,
    errors: [
      {
        status: 201,
        description: `Null response`,
        schema: createpets201Schema,
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
        schema: addpet405Schema,
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
        schema: updatepet400Schema,
      },
      {
        status: 404,
        description: `Pet not found`,
        schema: updatepet404Schema,
      },
      {
        status: 405,
        description: `Validation exception`,
        schema: updatepet405Schema,
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
        schema: findpetsbystatus400Schema,
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
        schema: findpetsbytags400Schema,
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
        schema: getpetbyid400Schema,
      },
      {
        status: 404,
        description: `Pet not found`,
        schema: getpetbyid404Schema,
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
        schema: updatepetwithform405Schema,
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
        schema: deletepet400Schema,
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
        schema: loginuser400Schema,
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
        schema: getuserbyname400Schema,
      },
      {
        status: 404,
        description: `User not found`,
        schema: getuserbyname404Schema,
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
        schema: deleteuser400Schema,
      },
      {
        status: 404,
        description: `User not found`,
        schema: deleteuser404Schema,
      },
    ],
  },
])

export const api = new Zodios(endpoints)

export default api
