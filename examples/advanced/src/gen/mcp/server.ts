import { addFilesHandler } from './petRequests/addFiles.ts'
import { addPetHandler } from './petRequests/addPet.ts'
import { deletePetHandler } from './petRequests/deletePet.ts'
import { findPetsByStatusHandler } from './petRequests/findPetsByStatus.ts'
import { findPetsByTagsHandler } from './petRequests/findPetsByTags.ts'
import { getPetByIdHandler } from './petRequests/getPetById.ts'
import { updatePetHandler } from './petRequests/updatePet.ts'
import { updatePetWithFormHandler } from './petRequests/updatePetWithForm.ts'
import { uploadFileHandler } from './petRequests/uploadFile.ts'
import { createPetsHandler } from './petsRequests/createPets.ts'
import { createUserHandler } from './userRequests/createUser.ts'
import { createUsersWithListInputHandler } from './userRequests/createUsersWithListInput.ts'
import { deleteUserHandler } from './userRequests/deleteUser.ts'
import { getUserByNameHandler } from './userRequests/getUserByName.ts'
import { loginUserHandler } from './userRequests/loginUser.ts'
import { logoutUserHandler } from './userRequests/logoutUser.ts'
import { updateUserHandler } from './userRequests/updateUser.ts'
import { addFilesRequestData2Schema } from '../zod/petController/addFilesSchema.ts'
import { addPetRequestData2Schema } from '../zod/petController/addPetSchema.ts'
import { deletePetPathParams2Schema, deletePetHeaderParams2Schema } from '../zod/petController/deletePetSchema.ts'
import { findPetsByStatusPathParams2Schema } from '../zod/petController/findPetsByStatusSchema.ts'
import { findPetsByTagsQueryParams2Schema, findPetsByTagsHeaderParams2Schema } from '../zod/petController/findPetsByTagsSchema.ts'
import { getPetByIdPathParams2Schema } from '../zod/petController/getPetByIdSchema.ts'
import { updatePetRequestData2Schema } from '../zod/petController/updatePetSchema.ts'
import { updatePetWithFormPathParams2Schema, updatePetWithFormQueryParams2Schema } from '../zod/petController/updatePetWithFormSchema.ts'
import { uploadFileRequestData2Schema, uploadFilePathParams2Schema, uploadFileQueryParams2Schema } from '../zod/petController/uploadFileSchema.ts'
import {
  createPetsRequestData2Schema,
  createPetsPathParams2Schema,
  createPetsQueryParams2Schema,
  createPetsHeaderParams2Schema,
} from '../zod/petsController/createPetsSchema.ts'
import { createUserRequestData2Schema } from '../zod/userController/createUserSchema.ts'
import { createUsersWithListInputRequestData2Schema } from '../zod/userController/createUsersWithListInputSchema.ts'
import { deleteUserPathParams2Schema } from '../zod/userController/deleteUserSchema.ts'
import { getUserByNamePathParams2Schema } from '../zod/userController/getUserByNameSchema.ts'
import { loginUserQueryParams2Schema } from '../zod/userController/loginUserSchema.ts'
import { updateUserRequestData2Schema, updateUserPathParams2Schema } from '../zod/userController/updateUserSchema.ts'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'

export const server = new McpServer({
  name: 'Swagger Petstore - OpenAPI 3.0',
  version: '3.0.3',
})

server.tool(
  'createPets',
  'Make a POST request to /pets/{uuid}',
  {
    uuid: createPetsPathParams2Schema.shape['uuid'],
    data: createPetsRequestData2Schema,
    headers: createPetsHeaderParams2Schema,
    params: createPetsQueryParams2Schema,
  },
  async ({ uuid, data, headers, params }) => {
    return createPetsHandler({ uuid, data, headers, params })
  },
)

server.tool('updatePet', 'Update an existing pet by Id', { data: updatePetRequestData2Schema }, async ({ data }) => {
  return updatePetHandler({ data })
})

server.tool('addPet', 'Add a new pet to the store', { data: addPetRequestData2Schema }, async ({ data }) => {
  return addPetHandler({ data })
})

server.tool(
  'findPetsByStatus',
  'Multiple status values can be provided with comma separated strings',
  { stepId: findPetsByStatusPathParams2Schema.shape['step_id'] },
  async ({ stepId }) => {
    return findPetsByStatusHandler({ stepId })
  },
)

server.tool(
  'findPetsByTags',
  'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
  { headers: findPetsByTagsHeaderParams2Schema, params: findPetsByTagsQueryParams2Schema },
  async ({ headers, params }) => {
    return findPetsByTagsHandler({ headers, params })
  },
)

server.tool('getPetById', 'Returns a single pet', { petId: getPetByIdPathParams2Schema.shape['petId'] }, async ({ petId }) => {
  return getPetByIdHandler({ petId })
})

server.tool(
  'updatePetWithForm',
  'Make a POST request to /pet/{petId}:search',
  { petId: updatePetWithFormPathParams2Schema.shape['petId'], params: updatePetWithFormQueryParams2Schema },
  async ({ petId, params }) => {
    return updatePetWithFormHandler({ petId, params })
  },
)

server.tool(
  'deletePet',
  'delete a pet',
  { petId: deletePetPathParams2Schema.shape['petId'], headers: deletePetHeaderParams2Schema },
  async ({ petId, headers }) => {
    return deletePetHandler({ petId, headers })
  },
)

server.tool('addFiles', 'Place a new file in the store', { data: addFilesRequestData2Schema }, async ({ data }) => {
  return addFilesHandler({ data })
})

server.tool(
  'uploadFile',
  'Make a POST request to /pet/{petId}/uploadImage',
  { petId: uploadFilePathParams2Schema.shape['petId'], data: uploadFileRequestData2Schema, params: uploadFileQueryParams2Schema },
  async ({ petId, data, params }) => {
    return uploadFileHandler({ petId, data, params })
  },
)

server.tool('createUser', 'This can only be done by the logged in user.', { data: createUserRequestData2Schema }, async ({ data }) => {
  return createUserHandler({ data })
})

server.tool(
  'createUsersWithListInput',
  'Creates list of users with given input array',
  { data: createUsersWithListInputRequestData2Schema },
  async ({ data }) => {
    return createUsersWithListInputHandler({ data })
  },
)

server.tool('loginUser', 'Make a GET request to /user/login', { params: loginUserQueryParams2Schema }, async ({ params }) => {
  return loginUserHandler({ params })
})

server.tool('logoutUser', 'Make a GET request to /user/logout', async () => {
  return logoutUserHandler()
})

server.tool('getUserByName', 'Make a GET request to /user/{username}', { username: getUserByNamePathParams2Schema.shape['username'] }, async ({ username }) => {
  return getUserByNameHandler({ username })
})

server.tool(
  'updateUser',
  'This can only be done by the logged in user.',
  { username: updateUserPathParams2Schema.shape['username'], data: updateUserRequestData2Schema },
  async ({ username, data }) => {
    return updateUserHandler({ username, data })
  },
)

server.tool('deleteUser', 'This can only be done by the logged in user.', { username: deleteUserPathParams2Schema.shape['username'] }, async ({ username }) => {
  return deleteUserHandler({ username })
})

async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
