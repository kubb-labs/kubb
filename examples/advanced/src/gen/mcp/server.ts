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
import { addFilesMutationRequestSchema } from '../zod/petController/addFilesSchema.ts'
import { addPetMutationRequestSchema } from '../zod/petController/addPetSchema.ts'
import { deletePetPathParamsSchema, deletePetHeaderParamsSchema } from '../zod/petController/deletePetSchema.ts'
import { findPetsByStatusPathParamsSchema } from '../zod/petController/findPetsByStatusSchema.ts'
import { findPetsByTagsQueryParamsSchema, findPetsByTagsHeaderParamsSchema } from '../zod/petController/findPetsByTagsSchema.ts'
import { getPetByIdPathParamsSchema } from '../zod/petController/getPetByIdSchema.ts'
import { updatePetMutationRequestSchema } from '../zod/petController/updatePetSchema.ts'
import { updatePetWithFormPathParamsSchema, updatePetWithFormQueryParamsSchema } from '../zod/petController/updatePetWithFormSchema.ts'
import { uploadFileMutationRequestSchema, uploadFilePathParamsSchema, uploadFileQueryParamsSchema } from '../zod/petController/uploadFileSchema.ts'
import {
  createPetsMutationRequestSchema,
  createPetsPathParamsSchema,
  createPetsQueryParamsSchema,
  createPetsHeaderParamsSchema,
} from '../zod/petsController/createPetsSchema.ts'
import { createUserMutationRequestSchema } from '../zod/userController/createUserSchema.ts'
import { createUsersWithListInputMutationRequestSchema } from '../zod/userController/createUsersWithListInputSchema.ts'
import { deleteUserPathParamsSchema } from '../zod/userController/deleteUserSchema.ts'
import { getUserByNamePathParamsSchema } from '../zod/userController/getUserByNameSchema.ts'
import { loginUserQueryParamsSchema } from '../zod/userController/loginUserSchema.ts'
import { updateUserMutationRequestSchema, updateUserPathParamsSchema } from '../zod/userController/updateUserSchema.ts'
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
    uuid: createPetsPathParamsSchema.shape['uuid'],
    data: createPetsMutationRequestSchema,
    headers: createPetsHeaderParamsSchema,
    params: createPetsQueryParamsSchema,
  },
  async ({ uuid, data, headers, params }) => {
    return createPetsHandler({ uuid, data, headers, params })
  },
)

server.tool('updatePet', 'Update an existing pet by Id', { data: updatePetMutationRequestSchema }, async ({ data }) => {
  return updatePetHandler({ data })
})

server.tool('addPet', 'Add a new pet to the store', { data: addPetMutationRequestSchema }, async ({ data }) => {
  return addPetHandler({ data })
})

server.tool(
  'findPetsByStatus',
  'Multiple status values can be provided with comma separated strings',
  { stepId: findPetsByStatusPathParamsSchema.shape['step_id'] },
  async ({ stepId }) => {
    return findPetsByStatusHandler({ stepId })
  },
)

server.tool(
  'findPetsByTags',
  'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
  { headers: findPetsByTagsHeaderParamsSchema, params: findPetsByTagsQueryParamsSchema },
  async ({ headers, params }) => {
    return findPetsByTagsHandler({ headers, params })
  },
)

server.tool('getPetById', 'Returns a single pet', { petId: getPetByIdPathParamsSchema.shape['petId'] }, async ({ petId }) => {
  return getPetByIdHandler({ petId })
})

server.tool(
  'updatePetWithForm',
  'Make a POST request to /pet/{petId}',
  { petId: updatePetWithFormPathParamsSchema.shape['petId'], params: updatePetWithFormQueryParamsSchema },
  async ({ petId, params }) => {
    return updatePetWithFormHandler({ petId, params })
  },
)

server.tool(
  'deletePet',
  'delete a pet',
  { petId: deletePetPathParamsSchema.shape['petId'], headers: deletePetHeaderParamsSchema },
  async ({ petId, headers }) => {
    return deletePetHandler({ petId, headers })
  },
)

server.tool('addFiles', 'Place a new file in the store', { data: addFilesMutationRequestSchema }, async ({ data }) => {
  return addFilesHandler({ data })
})

server.tool(
  'uploadFile',
  'Make a POST request to /pet/{petId}/uploadImage',
  { petId: uploadFilePathParamsSchema.shape['petId'], data: uploadFileMutationRequestSchema, params: uploadFileQueryParamsSchema },
  async ({ petId, data, params }) => {
    return uploadFileHandler({ petId, data, params })
  },
)

server.tool('createUser', 'This can only be done by the logged in user.', { data: createUserMutationRequestSchema }, async ({ data }) => {
  return createUserHandler({ data })
})

server.tool(
  'createUsersWithListInput',
  'Creates list of users with given input array',
  { data: createUsersWithListInputMutationRequestSchema },
  async ({ data }) => {
    return createUsersWithListInputHandler({ data })
  },
)

server.tool('loginUser', 'Make a GET request to /user/login', { params: loginUserQueryParamsSchema }, async ({ params }) => {
  return loginUserHandler({ params })
})

server.tool('logoutUser', 'Make a GET request to /user/logout', async () => {
  return logoutUserHandler()
})

server.tool('getUserByName', 'Make a GET request to /user/{username}', { username: getUserByNamePathParamsSchema.shape['username'] }, async ({ username }) => {
  return getUserByNameHandler({ username })
})

server.tool(
  'updateUser',
  'This can only be done by the logged in user.',
  { username: updateUserPathParamsSchema.shape['username'], data: updateUserMutationRequestSchema },
  async ({ username, data }) => {
    return updateUserHandler({ username, data })
  },
)

server.tool('deleteUser', 'This can only be done by the logged in user.', { username: deleteUserPathParamsSchema.shape['username'] }, async ({ username }) => {
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
