import { makeApi, Zodios } from '@zodios/core'

import { findPetsByStatusResponseSchema, findPetsByStatusQueryParamsSchema } from './zod/findPetsByStatusSchema'
import { findPetsByTagsResponseSchema, findPetsByTagsQueryParamsSchema } from './zod/findPetsByTagsSchema'
import { getPetByIdResponseSchema, getPetByIdPathParamsSchema } from './zod/getPetByIdSchema'
import { getInventoryResponseSchema } from './zod/getInventorySchema'
import { getOrderByIdResponseSchema, getOrderByIdPathParamsSchema } from './zod/getOrderByIdSchema'
import { loginUserResponseSchema, loginUserQueryParamsSchema } from './zod/loginUserSchema'
import { logoutUserResponseSchema } from './zod/logoutUserSchema'
import { getUserByNameResponseSchema, getUserByNamePathParamsSchema } from './zod/getUserByNameSchema'

const endpoints = makeApi([
  {
    method: `get`,
    // TODO add utils
    path: `/pet/findByStatus`,
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
    errors: [],
  },

  {
    method: `get`,
    // TODO add utils
    path: `/pet/findByTags`,
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
    errors: [],
  },

  {
    method: `get`,
    // TODO add utils
    path: `/pet/:petId`,
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
    errors: [],
  },

  {
    method: `get`,
    // TODO add utils
    path: `/store/inventory`,
    description: `Returns a map of status codes to quantities`,
    requestFormat: 'json',
    parameters: [],
    response: getInventoryResponseSchema,
    errors: [],
  },

  {
    method: `get`,
    // TODO add utils
    path: `/store/order/:orderId`,
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
    errors: [],
  },

  {
    method: `get`,
    // TODO add utils
    path: `/user/login`,
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
    errors: [],
  },

  {
    method: `get`,
    // TODO add utils
    path: `/user/logout`,
    description: ``,
    requestFormat: 'json',
    parameters: [],
    response: logoutUserResponseSchema,
    errors: [],
  },

  {
    method: `get`,
    // TODO add utils
    path: `/user/:username`,
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
    errors: [],
  },
])

export const api = new Zodios(endpoints)

export default api
