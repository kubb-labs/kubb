import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'
import { z } from 'zod'
import { addFilesMutationRequestSchema, addFilesMutationResponseSchema } from '../zod/petController/addFilesSchema.ts'
import { addPetMutationRequestSchema, addPetMutationResponseSchema } from '../zod/petController/addPetSchema.ts'
import { deletePetHeaderParamsSchema, deletePetMutationResponseSchema } from '../zod/petController/deletePetSchema.ts'
import { findPetsByStatusQueryResponseSchema } from '../zod/petController/findPetsByStatusSchema.ts'
import {
  findPetsByTagsHeaderParamsSchema,
  findPetsByTagsQueryParamsSchema,
  findPetsByTagsQueryResponseSchema,
} from '../zod/petController/findPetsByTagsSchema.ts'
import { getPetByIdQueryResponseSchema } from '../zod/petController/getPetByIdSchema.ts'
import { updatePetMutationRequestSchema, updatePetMutationResponseSchema } from '../zod/petController/updatePetSchema.ts'
import { updatePetWithFormMutationResponseSchema, updatePetWithFormQueryParamsSchema } from '../zod/petController/updatePetWithFormSchema.ts'
import { uploadFileMutationRequestSchema, uploadFileMutationResponseSchema, uploadFileQueryParamsSchema } from '../zod/petController/uploadFileSchema.ts'
import {
  createPetsHeaderParamsSchema,
  createPetsMutationRequestSchema,
  createPetsMutationResponseSchema,
  createPetsQueryParamsSchema,
} from '../zod/petsController/createPetsSchema.ts'
import { createUserMutationRequestSchema, createUserMutationResponseSchema } from '../zod/userController/createUserSchema.ts'
import {
  createUsersWithListInputMutationRequestSchema,
  createUsersWithListInputMutationResponseSchema,
} from '../zod/userController/createUsersWithListInputSchema.ts'
import { deleteUserMutationResponseSchema } from '../zod/userController/deleteUserSchema.ts'
import { getUserByNameQueryResponseSchema } from '../zod/userController/getUserByNameSchema.ts'
import { loginUserQueryParamsSchema, loginUserQueryResponseSchema } from '../zod/userController/loginUserSchema.ts'
import { logoutUserQueryResponseSchema } from '../zod/userController/logoutUserSchema.ts'
import { updateUserMutationRequestSchema, updateUserMutationResponseSchema } from '../zod/userController/updateUserSchema.ts'
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

export const server = new McpServer({
  name: 'Swagger PetStore - OpenAPI 3.0',
  version: '3.0.3',
})

server.registerTool(
  'createPets',
  {
    title: 'Create a pet',
    description: 'Make a POST request to /pets/{uuid}',
    outputSchema: { data: createPetsMutationResponseSchema },
    inputSchema: { uuid: z.string(), data: createPetsMutationRequestSchema, headers: createPetsHeaderParamsSchema, params: createPetsQueryParamsSchema },
  },
  async ({ uuid, data, headers, params }) => {
    return createPetsHandler({ uuid, data, headers, params })
  },
)

server.registerTool(
  'updatePet',
  {
    title: 'Update an existing pet',
    description: 'Update an existing pet by Id',
    outputSchema: { data: updatePetMutationResponseSchema },
    inputSchema: { data: updatePetMutationRequestSchema },
  },
  async ({ data }) => {
    return updatePetHandler({ data })
  },
)

server.registerTool(
  'addPet',
  {
    title: 'Add a new pet to the store',
    description: 'Add a new pet to the store',
    outputSchema: { data: addPetMutationResponseSchema },
    inputSchema: { data: addPetMutationRequestSchema },
  },
  async ({ data }) => {
    return addPetHandler({ data })
  },
)

server.registerTool(
  'findPetsByStatus',
  {
    title: 'Finds Pets by status',
    description: 'Multiple status values can be provided with comma separated strings',
    outputSchema: { data: findPetsByStatusQueryResponseSchema },
    inputSchema: { stepId: z.string() },
  },
  async ({ stepId }) => {
    return findPetsByStatusHandler({ stepId })
  },
)

server.registerTool(
  'findPetsByTags',
  {
    title: 'Finds Pets by tags',
    description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
    outputSchema: { data: findPetsByTagsQueryResponseSchema },
    inputSchema: { headers: findPetsByTagsHeaderParamsSchema, params: findPetsByTagsQueryParamsSchema },
  },
  async ({ headers, params }) => {
    return findPetsByTagsHandler({ headers, params })
  },
)

server.registerTool(
  'getPetById',
  {
    title: 'Find pet by ID',
    description: 'Returns a single pet',
    outputSchema: { data: getPetByIdQueryResponseSchema },
    inputSchema: { petId: z.coerce.number() },
  },
  async ({ petId }) => {
    return getPetByIdHandler({ petId })
  },
)

server.registerTool(
  'updatePetWithForm',
  {
    title: 'Updates a pet in the store with form data',
    description: 'Make a POST request to /pet/{petId}:search',
    outputSchema: { data: updatePetWithFormMutationResponseSchema },
    inputSchema: { petId: z.coerce.number(), params: updatePetWithFormQueryParamsSchema },
  },
  async ({ petId, params }) => {
    return updatePetWithFormHandler({ petId, params })
  },
)

server.registerTool(
  'deletePet',
  {
    title: 'Deletes a pet',
    description: 'delete a pet',
    outputSchema: { data: deletePetMutationResponseSchema },
    inputSchema: { petId: z.coerce.number(), headers: deletePetHeaderParamsSchema },
  },
  async ({ petId, headers }) => {
    return deletePetHandler({ petId, headers })
  },
)

server.registerTool(
  'addFiles',
  {
    title: 'Place an file for a pet',
    description: 'Place a new file in the store',
    outputSchema: { data: addFilesMutationResponseSchema },
    inputSchema: { data: addFilesMutationRequestSchema },
  },
  async ({ data }) => {
    return addFilesHandler({ data })
  },
)

server.registerTool(
  'uploadFile',
  {
    title: 'uploads an image',
    description: 'Make a POST request to /pet/{petId}/uploadImage',
    outputSchema: { data: uploadFileMutationResponseSchema },
    inputSchema: { petId: z.coerce.number(), data: uploadFileMutationRequestSchema, params: uploadFileQueryParamsSchema },
  },
  async ({ petId, data, params }) => {
    return uploadFileHandler({ petId, data, params })
  },
)

server.registerTool(
  'createUser',
  {
    title: 'Create user',
    description: 'This can only be done by the logged in user.',
    outputSchema: { data: createUserMutationResponseSchema },
    inputSchema: { data: createUserMutationRequestSchema },
  },
  async ({ data }) => {
    return createUserHandler({ data })
  },
)

server.registerTool(
  'createUsersWithListInput',
  {
    title: 'Creates list of users with given input array',
    description: 'Creates list of users with given input array',
    outputSchema: { data: createUsersWithListInputMutationResponseSchema },
    inputSchema: { data: createUsersWithListInputMutationRequestSchema },
  },
  async ({ data }) => {
    return createUsersWithListInputHandler({ data })
  },
)

server.registerTool(
  'loginUser',
  {
    title: 'Logs user into the system',
    description: 'Make a GET request to /user/login',
    outputSchema: { data: loginUserQueryResponseSchema },
    inputSchema: { params: loginUserQueryParamsSchema },
  },
  async ({ params }) => {
    return loginUserHandler({ params })
  },
)

server.registerTool(
  'logoutUser',
  {
    title: 'Logs out current logged in user session',
    description: 'Make a GET request to /user/logout',
    outputSchema: { data: logoutUserQueryResponseSchema },
  },
  async () => {
    return logoutUserHandler()
  },
)

server.registerTool(
  'getUserByName',
  {
    title: 'Get user by user name',
    description: 'Make a GET request to /user/{username}',
    outputSchema: { data: getUserByNameQueryResponseSchema },
    inputSchema: { username: z.string() },
  },
  async ({ username }) => {
    return getUserByNameHandler({ username })
  },
)

server.registerTool(
  'updateUser',
  {
    title: 'Update user',
    description: 'This can only be done by the logged in user.',
    outputSchema: { data: updateUserMutationResponseSchema },
    inputSchema: { username: z.string(), data: updateUserMutationRequestSchema },
  },
  async ({ username, data }) => {
    return updateUserHandler({ username, data })
  },
)

server.registerTool(
  'deleteUser',
  {
    title: 'Delete user',
    description: 'This can only be done by the logged in user.',
    outputSchema: { data: deleteUserMutationResponseSchema },
    inputSchema: { username: z.string() },
  },
  async ({ username }) => {
    return deleteUserHandler({ username })
  },
)

export async function startServer() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
