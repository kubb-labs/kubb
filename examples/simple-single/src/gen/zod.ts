import { z } from 'zod'

export const addressSchema = z.object({
  'street': z.string().optional(),
  'city': z.string().optional(),
  'state': z.string().optional(),
  'zip': z.string().optional(),
})
export const apiResponseSchema = z.object({ 'code': z.number().optional(), 'type': z.string().optional(), 'message': z.string().optional() })
export const categorySchema = z.object({ 'id': z.number().optional(), 'name': z.string().optional() })
export const orderSchema = z.object({
  'id': z.number().optional(),
  'petId': z.number().optional(),
  'quantity': z.number().optional(),
  'shipDate': z.string().datetime().optional(),
  'status': z.enum([`placed`, `approved`, `delivered`]).describe(`Order Status`).optional(),
  'http_status': z.union([z.literal(200), z.literal(400), z.literal(500)]).describe(`HTTP Status`).optional(),
  'complete': z.boolean().optional(),
})
export const petNotFoundSchema = z.object({ 'code': z.number().optional(), 'message': z.string().optional() })
export const tagSchema = z.object({ 'id': z.number().optional(), 'name': z.string().optional() })
export const userSchema = z.object({
  'id': z.number().optional(),
  'username': z.string().optional(),
  'firstName': z.string().optional(),
  'lastName': z.string().optional(),
  'email': z.string().email().optional(),
  'password': z.string().optional(),
  'phone': z.string().optional(),
  'userStatus': z.number().describe(`User Status`).optional(),
})
export const customerSchema = z.object({
  'id': z.number().optional(),
  'username': z.string().optional(),
  'address': z.array(z.lazy(() => addressSchema)).optional(),
})
export const userArraySchema = z.array(z.lazy(() => userSchema))
export const addPetRequestSchema = z.object({
  'id': z.number().optional(),
  'name': z.string(),
  'category': z.lazy(() => categorySchema).optional(),
  'photoUrls': z.array(z.string()),
  'tags': z.array(z.lazy(() => tagSchema)).optional(),
  'status': z.enum([`available`, `pending`, `sold`]).describe(`pet status in the store`).optional(),
})
export const petSchema = z.object({
  'id': z.number().optional(),
  'name': z.string(),
  'category': z.lazy(() => categorySchema).optional(),
  'photoUrls': z.array(z.string()),
  'tags': z.array(z.lazy(() => tagSchema)).optional(),
  'status': z.enum([`available`, `pending`, `sold`]).describe(`pet status in the store`).optional(),
})
/**
 * @description Invalid ID supplied
 */
export const updatePet400Schema = z.any()

/**
 * @description Pet not found
 */
export const updatePet404Schema = z.any()

/**
 * @description Validation exception
 */
export const updatePet405Schema = z.any()

/**
 * @description Update an existent pet in the store
 */
export const updatePetMutationRequestSchema = z.lazy(() => petSchema)

/**
 * @description Successful operation
 */
export const updatePetMutationResponseSchema = z.lazy(() => petSchema)

export const addPet405Schema = z.object({ 'code': z.number().optional(), 'message': z.string().optional() })

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema)

/**
 * @description Successful operation
 */
export const addPetMutationResponseSchema = z.lazy(() => petSchema)

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()
export const findPetsByStatusQueryParamsSchema = z.object({
  'status': z.enum([`available`, `pending`, `sold`]).default('available').describe(`Status values that need to be considered for filter`).optional(),
}).optional()

/**
 * @description successful operation
 */
export const findPetsByStatusQueryResponseSchema = z.array(z.lazy(() => petSchema))

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any()
export const findPetsByTagsQueryParamsSchema = z.object({
  'tags': z.array(z.string()).describe(`Tags to filter by`).optional(),
  'page': z.string().describe(`to request with required page number or pagination`).optional(),
  'pageSize': z.string().describe(`to request with required page size`).optional(),
}).optional()

/**
 * @description successful operation
 */
export const findPetsByTagsQueryResponseSchema = z.array(z.lazy(() => petSchema))

/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any()

/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any()
export const getPetByIdPathParamsSchema = z.object({ 'petId': z.number().describe(`ID of pet to return`) })

/**
 * @description successful operation
 */
export const getPetByIdQueryResponseSchema = z.lazy(() => petSchema)

/**
 * @description Invalid input
 */
export const updatePetWithForm405Schema = z.any()
export const updatePetWithFormMutationResponseSchema = z.any()
export const updatePetWithFormPathParamsSchema = z.object({ 'petId': z.number().describe(`ID of pet that needs to be updated`) })
export const updatePetWithFormQueryParamsSchema = z.object({
  'name': z.string().describe(`Name of pet that needs to be updated`).optional(),
  'status': z.string().describe(`Status of pet that needs to be updated`).optional(),
}).optional()

/**
 * @description Invalid pet value
 */
export const deletePet400Schema = z.any()
export const deletePetHeaderParamsSchema = z.object({ 'api_key': z.string().optional() }).optional()
export const deletePetMutationResponseSchema = z.any()
export const deletePetPathParamsSchema = z.object({ 'petId': z.number().describe(`Pet id to delete`) })

export const uploadFileMutationRequestSchema = z.string()
export const uploadFilePathParamsSchema = z.object({ 'petId': z.number().describe(`ID of pet to update`) })
export const uploadFileQueryParamsSchema = z.object({ 'additionalMetadata': z.string().describe(`Additional Metadata`).optional() }).optional()

/**
 * @description successful operation
 */
export const uploadFileMutationResponseSchema = z.lazy(() => apiResponseSchema)

/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.number())

/**
 * @description Invalid input
 */
export const placeOrder405Schema = z.any()
export const placeOrderMutationRequestSchema = z.lazy(() => orderSchema)

/**
 * @description successful operation
 */
export const placeOrderMutationResponseSchema = z.lazy(() => orderSchema)

/**
 * @description Invalid input
 */
export const placeOrderPatch405Schema = z.any()
export const placeOrderPatchMutationRequestSchema = z.lazy(() => orderSchema)

/**
 * @description successful operation
 */
export const placeOrderPatchMutationResponseSchema = z.lazy(() => orderSchema)

/**
 * @description Invalid ID supplied
 */
export const getOrderById400Schema = z.any()

/**
 * @description Order not found
 */
export const getOrderById404Schema = z.any()
export const getOrderByIdPathParamsSchema = z.object({ 'orderId': z.number().describe(`ID of order that needs to be fetched`) })

/**
 * @description successful operation
 */
export const getOrderByIdQueryResponseSchema = z.lazy(() => orderSchema)

/**
 * @description Invalid ID supplied
 */
export const deleteOrder400Schema = z.any()

/**
 * @description Order not found
 */
export const deleteOrder404Schema = z.any()
export const deleteOrderMutationResponseSchema = z.any()
export const deleteOrderPathParamsSchema = z.object({ 'orderId': z.number().describe(`ID of the order that needs to be deleted`) })

export const createUserMutationResponseSchema = z.any()

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)

export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema))

/**
 * @description Successful operation
 */
export const createUsersWithListInputMutationResponseSchema = z.lazy(() => userSchema)

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any()
export const loginUserQueryParamsSchema = z.object({
  'username': z.string().describe(`The user name for login`).optional(),
  'password': z.string().describe(`The password for login in clear text`).optional(),
}).optional()

/**
 * @description successful operation
 */
export const loginUserQueryResponseSchema = z.string()

export const logoutUserQueryResponseSchema = z.any()

/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any()

/**
 * @description User not found
 */
export const getUserByName404Schema = z.any()
export const getUserByNamePathParamsSchema = z.object({ 'username': z.string().describe(`The name that needs to be fetched. Use user1 for testing. `) })

/**
 * @description successful operation
 */
export const getUserByNameQueryResponseSchema = z.lazy(() => userSchema)

export const updateUserMutationResponseSchema = z.any()
export const updateUserPathParamsSchema = z.object({ 'username': z.string().describe(`name that need to be deleted`) })

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema)

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any()

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any()
export const deleteUserMutationResponseSchema = z.any()
export const deleteUserPathParamsSchema = z.object({ 'username': z.string().describe(`The name that needs to be deleted`) })
