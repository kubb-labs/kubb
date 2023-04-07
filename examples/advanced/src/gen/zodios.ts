import { makeApi, Zodios } from '@zodios/core'

import { addPetResponseSchema, addPet405Schema } from './zod/petController/addPetSchema'
import { updatePetResponseSchema, updatePet400Schema, updatePet404Schema, updatePet405Schema } from './zod/petController/updatePetSchema'
import { findPetsByStatusResponseSchema, findPetsByStatusQueryParamsSchema, findPetsByStatus400Schema } from './zod/petController/findPetsByStatusSchema'
import { findPetsByTagsResponseSchema, findPetsByTagsQueryParamsSchema, findPetsByTags400Schema } from './zod/petController/findPetsByTagsSchema'
import { getPetByIdResponseSchema, getPetByIdPathParamsSchema, getPetById400Schema, getPetById404Schema } from './zod/petController/getPetByIdSchema'
import {
  updatePetWithFormResponseSchema,
  updatePetWithFormPathParamsSchema,
  updatePetWithFormQueryParamsSchema,
  updatePetWithForm405Schema,
} from './zod/petController/updatePetWithFormSchema'
import { deletePetResponseSchema, deletePetPathParamsSchema, deletePet400Schema } from './zod/petController/deletePetSchema'
import { uploadFileResponseSchema, uploadFilePathParamsSchema, uploadFileQueryParamsSchema } from './zod/petController/uploadFileSchema'
import { getInventoryResponseSchema } from './zod/storeController/getInventorySchema'
import { placeOrderResponseSchema, placeOrder405Schema } from './zod/storeController/placeOrderSchema'
import {
  getOrderByIdResponseSchema,
  getOrderByIdPathParamsSchema,
  getOrderById400Schema,
  getOrderById404Schema,
} from './zod/storeController/getOrderByIdSchema'
import { deleteOrderResponseSchema, deleteOrderPathParamsSchema, deleteOrder400Schema, deleteOrder404Schema } from './zod/storeController/deleteOrderSchema'
import { createUserResponseSchema } from './zod/userController/createUserSchema'
import { createUsersWithListInputResponseSchema } from './zod/userController/createUsersWithListInputSchema'
import { loginUserResponseSchema, loginUserQueryParamsSchema, loginUser400Schema } from './zod/userController/loginUserSchema'
import { logoutUserResponseSchema } from './zod/userController/logoutUserSchema'
import {
  getUserByNameResponseSchema,
  getUserByNamePathParamsSchema,
  getUserByName400Schema,
  getUserByName404Schema,
} from './zod/userController/getUserByNameSchema'
import { updateUserResponseSchema, updateUserPathParamsSchema } from './zod/userController/updateUserSchema'
import { deleteUserResponseSchema, deleteUserPathParamsSchema, deleteUser400Schema, deleteUser404Schema } from './zod/userController/deleteUserSchema'

const endpoints = makeApi([
  {
    method: 'post',
    path: '/pet',
    description: `Add a new pet to the store`,
    requestFormat: 'json',
    parameters: [],
    response: addPetResponseSchema,
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
    response: updatePetResponseSchema,
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
    response: findPetsByStatusResponseSchema,
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
    response: findPetsByTagsResponseSchema,
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
    response: getPetByIdResponseSchema,
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
    response: updatePetWithFormResponseSchema,
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
    response: deletePetResponseSchema,
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
    response: uploadFileResponseSchema,
    errors: [],
  },

  {
    method: 'get',
    path: '/store/inventory',
    description: `Returns a map of status codes to quantities`,
    requestFormat: 'json',
    parameters: [],
    response: getInventoryResponseSchema,
    errors: [],
  },

  {
    method: 'post',
    path: '/store/order',
    description: `Place a new order in the store`,
    requestFormat: 'json',
    parameters: [],
    response: placeOrderResponseSchema,
    errors: [
      {
        status: 405,
        description: `Invalid input`,
        schema: placeOrder405Schema,
      },
    ],
  },

  {
    method: 'get',
    path: '/store/order/:orderId',
    description: `For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'GetOrderByIdPathParams',
        description: ``,
        type: 'Path',
        schema: getOrderByIdPathParamsSchema,
      },
    ],
    response: getOrderByIdResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid ID supplied`,
        schema: getOrderById400Schema,
      },
      {
        status: 404,
        description: `Order not found`,
        schema: getOrderById404Schema,
      },
    ],
  },

  {
    method: 'delete',
    path: '/store/order/:orderId',
    description: `For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'DeleteOrderPathParams',
        description: ``,
        type: 'Path',
        schema: deleteOrderPathParamsSchema,
      },
    ],
    response: deleteOrderResponseSchema,
    errors: [
      {
        status: 400,
        description: `Invalid ID supplied`,
        schema: deleteOrder400Schema,
      },
      {
        status: 404,
        description: `Order not found`,
        schema: deleteOrder404Schema,
      },
    ],
  },

  {
    method: 'post',
    path: '/user',
    description: `This can only be done by the logged in user.`,
    requestFormat: 'json',
    parameters: [],
    response: createUserResponseSchema,
    errors: [],
  },

  {
    method: 'post',
    path: '/user/createWithList',
    description: `Creates list of users with given input array`,
    requestFormat: 'json',
    parameters: [],
    response: createUsersWithListInputResponseSchema,
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
    response: loginUserResponseSchema,
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
    response: logoutUserResponseSchema,
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
    response: getUserByNameResponseSchema,
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
    response: updateUserResponseSchema,
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
    response: deleteUserResponseSchema,
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
