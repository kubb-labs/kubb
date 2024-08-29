export const orderStatus = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderStatus = (typeof orderStatus)[keyof typeof orderStatus]

export const orderHttpStatus = {
  '200': 200,
  '400': 400,
  '500': 500,
} as const

export type OrderHttpStatus = (typeof orderHttpStatus)[keyof typeof orderHttpStatus]

export type Order = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type integer | undefined, int64
   */
  petId?: number
  /**
   * @type integer | undefined, int32
   */
  quantity?: number
  /**
   * @type string | undefined, date-time
   */
  shipDate?: string
  /**
   * @description Order Status
   * @type string | undefined
   */
  status?: OrderStatus
  /**
   * @description HTTP Status
   * @type number | undefined
   */
  http_status?: OrderHttpStatus
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}

export type Customer = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  username?: string
  /**
   * @type array | undefined
   */
  address?: Address[]
}

export type Address = {
  /**
   * @type string | undefined
   */
  street?: string
  /**
   * @type string | undefined
   */
  city?: string
  /**
   * @type string | undefined
   */
  state?: string
  /**
   * @type string | undefined
   */
  zip?: string
}

export type Category = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  name?: string
}

export type User = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  username?: string
  /**
   * @type string | undefined
   */
  firstName?: string
  /**
   * @type string | undefined
   */
  lastName?: string
  /**
   * @type string | undefined
   */
  email?: string
  /**
   * @type string | undefined
   */
  password?: string
  /**
   * @type string | undefined
   */
  phone?: string
  /**
   * @description User Status
   * @type integer | undefined, int32
   */
  userStatus?: number
}

export type Tag = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  name?: string
}

export const petStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatus = (typeof petStatus)[keyof typeof petStatus]

export type Pet = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string
   */
  name: string
  category?: Category
  /**
   * @type array
   */
  photoUrls: string[]
  /**
   * @type array | undefined
   */
  tags?: Tag[]
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: PetStatus
}

export const addPetRequestStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatus = (typeof addPetRequestStatus)[keyof typeof addPetRequestStatus]

export type AddPetRequest = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string
   */
  name: string
  category?: Category
  /**
   * @type array
   */
  photoUrls: string[]
  /**
   * @type array | undefined
   */
  tags?: Tag[]
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: AddPetRequestStatus
}

export type ApiResponse = {
  /**
   * @type integer | undefined, int32
   */
  code?: number
  /**
   * @type string | undefined
   */
  type?: string
  /**
   * @type string | undefined
   */
  message?: string
}

export type PetNotFound = {
  /**
   * @type integer | undefined, int32
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

export type UserArray = User[]

/**
 * @description Successful operation
 */
export type UpdatePet200 = Pet

/**
 * @description Invalid ID supplied
 */
export type UpdatePet400 = any

/**
 * @description Pet not found
 */
export type UpdatePet404 = any

/**
 * @description Validation exception
 */
export type UpdatePet405 = any

/**
 * @description Update an existent pet in the store
 */
export type UpdatePetMutationRequest = Pet

/**
 * @description Successful operation
 */
export type UpdatePetMutationResponse = Pet

export type UpdatePetMutation = {
  Response: UpdatePetMutationResponse
  Request: UpdatePetMutationRequest
  Errors: UpdatePet400 | UpdatePet404 | UpdatePet405
}

/**
 * @description Successful operation
 */
export type AddPet200 = Pet

/**
 * @description Pet not found
 */
export type AddPet405 = {
  /**
   * @type integer | undefined, int32
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = AddPetRequest

/**
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet

export type AddPetMutation = {
  Response: AddPetMutationResponse
  Request: AddPetMutationRequest
  Errors: AddPet405
}

export const findPetsByStatusQueryParamsStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type FindPetsByStatusQueryParamsStatus = (typeof findPetsByStatusQueryParamsStatus)[keyof typeof findPetsByStatusQueryParamsStatus]

export type FindPetsByStatusQueryParams = {
  /**
   * @description Status values that need to be considered for filter
   * @default "available"
   * @type string | undefined
   */
  status?: FindPetsByStatusQueryParamsStatus
}

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any

/**
 * @description successful operation
 */
export type FindPetsByStatusQueryResponse = Pet[]

export type FindPetsByStatusQuery = {
  Response: FindPetsByStatusQueryResponse
  QueryParams: FindPetsByStatusQueryParams
  Errors: FindPetsByStatus400
}

export type FindPetsByTagsQueryParams = {
  /**
   * @description Tags to filter by
   * @type array | undefined
   */
  tags?: string[]
  /**
   * @description to request with required page number or pagination
   * @type string | undefined
   */
  page?: string
  /**
   * @description to request with required page size
   * @type string | undefined
   */
  pageSize?: string
}

/**
 * @description successful operation
 */
export type FindPetsByTags200 = Pet[]

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any

/**
 * @description successful operation
 */
export type FindPetsByTagsQueryResponse = Pet[]

export type FindPetsByTagsQuery = {
  Response: FindPetsByTagsQueryResponse
  QueryParams: FindPetsByTagsQueryParams
  Errors: FindPetsByTags400
}

export type GetPetByIdPathParams = {
  /**
   * @description ID of pet to return
   * @type integer, int64
   */
  petId: number
}

/**
 * @description successful operation
 */
export type GetPetById200 = Pet

/**
 * @description Invalid ID supplied
 */
export type GetPetById400 = any

/**
 * @description Pet not found
 */
export type GetPetById404 = any

/**
 * @description successful operation
 */
export type GetPetByIdQueryResponse = Pet

export type GetPetByIdQuery = {
  Response: GetPetByIdQueryResponse
  PathParams: GetPetByIdPathParams
  Errors: GetPetById400 | GetPetById404
}

export type UpdatePetWithFormPathParams = {
  /**
   * @description ID of pet that needs to be updated
   * @type integer, int64
   */
  petId: number
}

export type UpdatePetWithFormQueryParams = {
  /**
   * @description Name of pet that needs to be updated
   * @type string | undefined
   */
  name?: string
  /**
   * @description Status of pet that needs to be updated
   * @type string | undefined
   */
  status?: string
}

/**
 * @description Invalid input
 */
export type UpdatePetWithForm405 = any

export type UpdatePetWithFormMutationResponse = any

export type UpdatePetWithFormMutation = {
  Response: UpdatePetWithFormMutationResponse
  PathParams: UpdatePetWithFormPathParams
  QueryParams: UpdatePetWithFormQueryParams
  Errors: UpdatePetWithForm405
}

export type DeletePetPathParams = {
  /**
   * @description Pet id to delete
   * @type integer, int64
   */
  petId: number
}

export type DeletePetHeaderParams = {
  /**
   * @type string | undefined
   */
  api_key?: string
}

/**
 * @description Invalid pet value
 */
export type DeletePet400 = any

export type DeletePetMutationResponse = any

export type DeletePetMutation = {
  Response: DeletePetMutationResponse
  PathParams: DeletePetPathParams
  HeaderParams: DeletePetHeaderParams
  Errors: DeletePet400
}

export type UploadFilePathParams = {
  /**
   * @description ID of pet to update
   * @type integer, int64
   */
  petId: number
}

export type UploadFileQueryParams = {
  /**
   * @description Additional Metadata
   * @type string | undefined
   */
  additionalMetadata?: string
}

/**
 * @description successful operation
 */
export type UploadFile200 = ApiResponse

export type UploadFileMutationRequest = Blob

/**
 * @description successful operation
 */
export type UploadFileMutationResponse = ApiResponse

export type UploadFileMutation = {
  Response: UploadFileMutationResponse
  Request: UploadFileMutationRequest
  PathParams: UploadFilePathParams
  QueryParams: UploadFileQueryParams
}

/**
 * @description successful operation
 */
export type GetInventory200 = {
  [key: string]: number
}

/**
 * @description successful operation
 */
export type GetInventoryQueryResponse = {
  [key: string]: number
}

export type GetInventoryQuery = {
  Response: GetInventoryQueryResponse
}

/**
 * @description successful operation
 */
export type PlaceOrder200 = Order

/**
 * @description Invalid input
 */
export type PlaceOrder405 = any

export type PlaceOrderMutationRequest = Order

/**
 * @description successful operation
 */
export type PlaceOrderMutationResponse = Order

export type PlaceOrderMutation = {
  Response: PlaceOrderMutationResponse
  Request: PlaceOrderMutationRequest
  Errors: PlaceOrder405
}

/**
 * @description successful operation
 */
export type PlaceOrderPatch200 = Order

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any

export type PlaceOrderPatchMutationRequest = Order

/**
 * @description successful operation
 */
export type PlaceOrderPatchMutationResponse = Order

export type PlaceOrderPatchMutation = {
  Response: PlaceOrderPatchMutationResponse
  Request: PlaceOrderPatchMutationRequest
  Errors: PlaceOrderPatch405
}

export type GetOrderByIdPathParams = {
  /**
   * @description ID of order that needs to be fetched
   * @type integer, int64
   */
  orderId: number
}

/**
 * @description successful operation
 */
export type GetOrderById200 = Order

/**
 * @description Invalid ID supplied
 */
export type GetOrderById400 = any

/**
 * @description Order not found
 */
export type GetOrderById404 = any

/**
 * @description successful operation
 */
export type GetOrderByIdQueryResponse = Order

export type GetOrderByIdQuery = {
  Response: GetOrderByIdQueryResponse
  PathParams: GetOrderByIdPathParams
  Errors: GetOrderById400 | GetOrderById404
}

export type DeleteOrderPathParams = {
  /**
   * @description ID of the order that needs to be deleted
   * @type integer, int64
   */
  orderId: number
}

/**
 * @description Invalid ID supplied
 */
export type DeleteOrder400 = any

/**
 * @description Order not found
 */
export type DeleteOrder404 = any

export type DeleteOrderMutationResponse = any

export type DeleteOrderMutation = {
  Response: DeleteOrderMutationResponse
  PathParams: DeleteOrderPathParams
  Errors: DeleteOrder400 | DeleteOrder404
}

/**
 * @description successful operation
 */
export type CreateUserError = User

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User

export type CreateUserMutationResponse = any

export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
}

/**
 * @description Successful operation
 */
export type CreateUsersWithListInput200 = User

/**
 * @description successful operation
 */
export type CreateUsersWithListInputError = any

export type CreateUsersWithListInputMutationRequest = User[]

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputMutationResponse = User

export type CreateUsersWithListInputMutation = {
  Response: CreateUsersWithListInputMutationResponse
  Request: CreateUsersWithListInputMutationRequest
}

export type LoginUserQueryParams = {
  /**
   * @description The user name for login
   * @type string | undefined
   */
  username?: string
  /**
   * @description The password for login in clear text
   * @type string | undefined
   */
  password?: string
}

/**
 * @description successful operation
 */
export type LoginUser200 = string

/**
 * @description Invalid username/password supplied
 */
export type LoginUser400 = any

/**
 * @description successful operation
 */
export type LoginUserQueryResponse = string

export type LoginUserQuery = {
  Response: LoginUserQueryResponse
  QueryParams: LoginUserQueryParams
  Errors: LoginUser400
}

/**
 * @description successful operation
 */
export type LogoutUserError = any

export type LogoutUserQueryResponse = any

export type LogoutUserQuery = {
  Response: LogoutUserQueryResponse
}

export type GetUserByNamePathParams = {
  /**
   * @description The name that needs to be fetched. Use user1 for testing.
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 */
export type GetUserByName200 = User

/**
 * @description Invalid username supplied
 */
export type GetUserByName400 = any

/**
 * @description User not found
 */
export type GetUserByName404 = any

/**
 * @description successful operation
 */
export type GetUserByNameQueryResponse = User

export type GetUserByNameQuery = {
  Response: GetUserByNameQueryResponse
  PathParams: GetUserByNamePathParams
  Errors: GetUserByName400 | GetUserByName404
}

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description successful operation
 */
export type UpdateUserError = any

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = User

export type UpdateUserMutationResponse = any

export type UpdateUserMutation = {
  Response: UpdateUserMutationResponse
  Request: UpdateUserMutationRequest
  PathParams: UpdateUserPathParams
}

export type DeleteUserPathParams = {
  /**
   * @description The name that needs to be deleted
   * @type string
   */
  username: string | null
}

/**
 * @description Invalid username supplied
 */
export type DeleteUser400 = any

/**
 * @description User not found
 */
export type DeleteUser404 = any

export type DeleteUserMutationResponse = any

export type DeleteUserMutation = {
  Response: DeleteUserMutationResponse
  PathParams: DeleteUserPathParams
  Errors: DeleteUser400 | DeleteUser404
}
