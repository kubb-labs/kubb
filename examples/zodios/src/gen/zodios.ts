import { Zodios, makeApi } from '@zodios/core'
import { addPet405Schema, addPetMutationRequestSchema, addPetMutationResponseSchema } from './zod/addPetSchema'
import { createUserMutationRequestSchema, createUserMutationResponseSchema } from './zod/createUserSchema'
import { createUsersWithListInputMutationRequestSchema, createUsersWithListInputMutationResponseSchema } from './zod/createUsersWithListInputSchema'
import { deleteOrder400Schema, deleteOrder404Schema, deleteOrderMutationResponseSchema, deleteOrderPathParamsSchema } from './zod/deleteOrderSchema'
import { deletePet400Schema, deletePetHeaderParamsSchema, deletePetMutationResponseSchema, deletePetPathParamsSchema } from './zod/deletePetSchema'
import { deleteUser400Schema, deleteUser404Schema, deleteUserMutationResponseSchema, deleteUserPathParamsSchema } from './zod/deleteUserSchema'
import { findPetsByStatus400Schema, findPetsByStatusQueryParamsSchema, findPetsByStatusQueryResponseSchema } from './zod/findPetsByStatusSchema'
import { findPetsByTags400Schema, findPetsByTagsQueryParamsSchema, findPetsByTagsQueryResponseSchema } from './zod/findPetsByTagsSchema'
import { getInventoryQueryResponseSchema } from './zod/getInventorySchema'
import { getOrderById400Schema, getOrderById404Schema, getOrderByIdPathParamsSchema, getOrderByIdQueryResponseSchema } from './zod/getOrderByIdSchema'
import { getPetById400Schema, getPetById404Schema, getPetByIdPathParamsSchema, getPetByIdQueryResponseSchema } from './zod/getPetByIdSchema'
import { getUserByName400Schema, getUserByName404Schema, getUserByNamePathParamsSchema, getUserByNameQueryResponseSchema } from './zod/getUserByNameSchema'
import { loginUser400Schema, loginUserQueryParamsSchema, loginUserQueryResponseSchema } from './zod/loginUserSchema'
import { logoutUserQueryResponseSchema } from './zod/logoutUserSchema'
import { placeOrderPatch405Schema, placeOrderPatchMutationRequestSchema, placeOrderPatchMutationResponseSchema } from './zod/placeOrderPatchSchema'
import { placeOrder405Schema, placeOrderMutationRequestSchema, placeOrderMutationResponseSchema } from './zod/placeOrderSchema'
import {
  updatePet400Schema,
  updatePet404Schema,
  updatePet405Schema,
  updatePetMutationRequestSchema,
  updatePetMutationResponseSchema,
} from './zod/updatePetSchema'
import {
  updatePetWithForm405Schema,
  updatePetWithFormMutationResponseSchema,
  updatePetWithFormPathParamsSchema,
  updatePetWithFormQueryParamsSchema,
} from './zod/updatePetWithFormSchema'
import { updateUserMutationRequestSchema, updateUserMutationResponseSchema, updateUserPathParamsSchema } from './zod/updateUserSchema'
import {
  uploadFileMutationRequestSchema,
  uploadFileMutationResponseSchema,
  uploadFilePathParamsSchema,
  uploadFileQueryParamsSchema,
} from './zod/uploadFileSchema'

export const endpoints = makeApi([
  {
    method: 'post',
    path: '/pet',
    description: 'Add a new pet to the store',
    requestFormat: 'json',
    parameters: [
      {
        name: 'AddPetMutationRequest',
        description: 'Create a new pet in the store',
        type: 'Body',
        schema: addPetMutationRequestSchema,
      },
    ],
    response: addPetMutationResponseSchema,
    errors: [
      {
        status: 405,
        description: 'Pet not found',
        schema: addPet405Schema,
      },
    ],
  },
  {
    method: 'put',
    path: '/pet',
    description: 'Update an existing pet by Id',
    requestFormat: 'json',
    parameters: [
      {
        name: 'UpdatePetMutationRequest',
        description: 'Update an existent pet in the store',
        type: 'Body',
        schema: updatePetMutationRequestSchema,
      },
    ],
    response: updatePetMutationResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid ID supplied',
        schema: updatePet400Schema,
      },
      {
        status: 404,
        description: 'Pet not found',
        schema: updatePet404Schema,
      },
      {
        status: 405,
        description: 'Validation exception',
        schema: updatePet405Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/pet/findByStatus',
    description: 'Multiple status values can be provided with comma separated strings',
    requestFormat: 'json',
    parameters: [
      {
        name: 'status',
        description: 'Status values that need to be considered for filter',
        type: 'Query',
        schema: findPetsByStatusQueryParamsSchema.unwrap().shape['status'],
      },
    ],
    response: findPetsByStatusQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid status value',
        schema: findPetsByStatus400Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/pet/findByTags',
    description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
    requestFormat: 'json',
    parameters: [
      {
        name: 'tags',
        description: 'Tags to filter by',
        type: 'Query',
        schema: findPetsByTagsQueryParamsSchema.unwrap().shape['tags'],
      },
      {
        name: 'page',
        description: 'to request with required page number or pagination',
        type: 'Query',
        schema: findPetsByTagsQueryParamsSchema.unwrap().shape['page'],
      },
      {
        name: 'pageSize',
        description: 'to request with required page size',
        type: 'Query',
        schema: findPetsByTagsQueryParamsSchema.unwrap().shape['pageSize'],
      },
    ],
    response: findPetsByTagsQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid tag value',
        schema: findPetsByTags400Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/pet/:petId',
    description: 'Returns a single pet',
    requestFormat: 'json',
    parameters: [
      {
        name: 'petId',
        description: 'ID of pet to return',
        type: 'Path',
        schema: getPetByIdPathParamsSchema.shape['petId'],
      },
    ],
    response: getPetByIdQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid ID supplied',
        schema: getPetById400Schema,
      },
      {
        status: 404,
        description: 'Pet not found',
        schema: getPetById404Schema,
      },
    ],
  },
  {
    method: 'post',
    path: '/pet/:petId',
    description: '',
    requestFormat: 'json',
    parameters: [
      {
        name: 'petId',
        description: 'ID of pet that needs to be updated',
        type: 'Path',
        schema: updatePetWithFormPathParamsSchema.shape['petId'],
      },
      {
        name: 'name',
        description: 'Name of pet that needs to be updated',
        type: 'Query',
        schema: updatePetWithFormQueryParamsSchema.unwrap().shape['name'],
      },
      {
        name: 'status',
        description: 'Status of pet that needs to be updated',
        type: 'Query',
        schema: updatePetWithFormQueryParamsSchema.unwrap().shape['status'],
      },
    ],
    response: updatePetWithFormMutationResponseSchema,
    errors: [
      {
        status: 405,
        description: 'Invalid input',
        schema: updatePetWithForm405Schema,
      },
    ],
  },
  {
    method: 'delete',
    path: '/pet/:petId',
    description: 'delete a pet',
    requestFormat: 'json',
    parameters: [
      {
        name: 'petId',
        description: 'Pet id to delete',
        type: 'Path',
        schema: deletePetPathParamsSchema.shape['petId'],
      },
      {
        name: 'api_key',
        description: '',
        type: 'Header',
        schema: deletePetHeaderParamsSchema.unwrap().shape['api_key'],
      },
    ],
    response: deletePetMutationResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid pet value',
        schema: deletePet400Schema,
      },
    ],
  },
  {
    method: 'post',
    path: '/pet/:petId/uploadImage',
    description: '',
    requestFormat: 'json',
    parameters: [
      {
        name: 'petId',
        description: 'ID of pet to update',
        type: 'Path',
        schema: uploadFilePathParamsSchema.shape['petId'],
      },
      {
        name: 'additionalMetadata',
        description: 'Additional Metadata',
        type: 'Query',
        schema: uploadFileQueryParamsSchema.unwrap().shape['additionalMetadata'],
      },
      {
        name: 'UploadFileMutationRequest',
        description: '',
        type: 'Body',
        schema: uploadFileMutationRequestSchema,
      },
    ],
    response: uploadFileMutationResponseSchema,
    errors: [],
  },
  {
    method: 'get',
    path: '/store/inventory',
    description: 'Returns a map of status codes to quantities',
    requestFormat: 'json',
    parameters: [],
    response: getInventoryQueryResponseSchema,
    errors: [],
  },
  {
    method: 'post',
    path: '/store/order',
    description: 'Place a new order in the store',
    requestFormat: 'json',
    parameters: [
      {
        name: 'PlaceOrderMutationRequest',
        description: '',
        type: 'Body',
        schema: placeOrderMutationRequestSchema,
      },
    ],
    response: placeOrderMutationResponseSchema,
    errors: [
      {
        status: 405,
        description: 'Invalid input',
        schema: placeOrder405Schema,
      },
    ],
  },
  {
    method: 'patch',
    path: '/store/order',
    description: 'Place a new order in the store with patch',
    requestFormat: 'json',
    parameters: [
      {
        name: 'PlaceOrderPatchMutationRequest',
        description: '',
        type: 'Body',
        schema: placeOrderPatchMutationRequestSchema,
      },
    ],
    response: placeOrderPatchMutationResponseSchema,
    errors: [
      {
        status: 405,
        description: 'Invalid input',
        schema: placeOrderPatch405Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/store/order/:orderId',
    description: 'For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.',
    requestFormat: 'json',
    parameters: [
      {
        name: 'orderId',
        description: 'ID of order that needs to be fetched',
        type: 'Path',
        schema: getOrderByIdPathParamsSchema.shape['orderId'],
      },
    ],
    response: getOrderByIdQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid ID supplied',
        schema: getOrderById400Schema,
      },
      {
        status: 404,
        description: 'Order not found',
        schema: getOrderById404Schema,
      },
    ],
  },
  {
    method: 'delete',
    path: '/store/order/:orderId',
    description: 'For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors',
    requestFormat: 'json',
    parameters: [
      {
        name: 'orderId',
        description: 'ID of the order that needs to be deleted',
        type: 'Path',
        schema: deleteOrderPathParamsSchema.shape['orderId'],
      },
    ],
    response: deleteOrderMutationResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid ID supplied',
        schema: deleteOrder400Schema,
      },
      {
        status: 404,
        description: 'Order not found',
        schema: deleteOrder404Schema,
      },
    ],
  },
  {
    method: 'post',
    path: '/user',
    description: 'This can only be done by the logged in user.',
    requestFormat: 'json',
    parameters: [
      {
        name: 'CreateUserMutationRequest',
        description: 'Created user object',
        type: 'Body',
        schema: createUserMutationRequestSchema,
      },
    ],
    response: createUserMutationResponseSchema,
    errors: [],
  },
  {
    method: 'post',
    path: '/user/createWithList',
    description: 'Creates list of users with given input array',
    requestFormat: 'json',
    parameters: [
      {
        name: 'CreateUsersWithListInputMutationRequest',
        description: '',
        type: 'Body',
        schema: createUsersWithListInputMutationRequestSchema,
      },
    ],
    response: createUsersWithListInputMutationResponseSchema,
    errors: [],
  },
  {
    method: 'get',
    path: '/user/login',
    description: '',
    requestFormat: 'json',
    parameters: [
      {
        name: 'username',
        description: 'The user name for login',
        type: 'Query',
        schema: loginUserQueryParamsSchema.unwrap().shape['username'],
      },
      {
        name: 'password',
        description: 'The password for login in clear text',
        type: 'Query',
        schema: loginUserQueryParamsSchema.unwrap().shape['password'],
      },
    ],
    response: loginUserQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid username/password supplied',
        schema: loginUser400Schema,
      },
    ],
  },
  {
    method: 'get',
    path: '/user/logout',
    description: '',
    requestFormat: 'json',
    parameters: [],
    response: logoutUserQueryResponseSchema,
    errors: [],
  },
  {
    method: 'get',
    path: '/user/:username',
    description: '',
    requestFormat: 'json',
    parameters: [
      {
        name: 'username',
        description: 'The name that needs to be fetched. Use user1 for testing. ',
        type: 'Path',
        schema: getUserByNamePathParamsSchema.shape['username'],
      },
    ],
    response: getUserByNameQueryResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid username supplied',
        schema: getUserByName400Schema,
      },
      {
        status: 404,
        description: 'User not found',
        schema: getUserByName404Schema,
      },
    ],
  },
  {
    method: 'put',
    path: '/user/:username',
    description: 'This can only be done by the logged in user.',
    requestFormat: 'json',
    parameters: [
      {
        name: 'username',
        description: 'name that need to be deleted',
        type: 'Path',
        schema: updateUserPathParamsSchema.shape['username'],
      },
      {
        name: 'UpdateUserMutationRequest',
        description: 'Update an existent user in the store',
        type: 'Body',
        schema: updateUserMutationRequestSchema,
      },
    ],
    response: updateUserMutationResponseSchema,
    errors: [],
  },
  {
    method: 'delete',
    path: '/user/:username',
    description: 'This can only be done by the logged in user.',
    requestFormat: 'json',
    parameters: [
      {
        name: 'username',
        description: 'The name that needs to be deleted',
        type: 'Path',
        schema: deleteUserPathParamsSchema.shape['username'],
      },
    ],
    response: deleteUserMutationResponseSchema,
    errors: [
      {
        status: 400,
        description: 'Invalid username supplied',
        schema: deleteUser400Schema,
      },
      {
        status: 404,
        description: 'User not found',
        schema: deleteUser404Schema,
      },
    ],
  },
])
export const getAPI = (baseUrl: string) => new Zodios(baseUrl, endpoints)
export const api = new Zodios('https://petstore3.swagger.io/api/v3', endpoints)
export default api
