export type Address = {
  /**
   * @type string | undefined
   * @example 437 Lytton
   */
  street?: string
  /**
   * @type string | undefined
   * @example Palo Alto
   */
  city?: string
  /**
   * @type string | undefined
   * @example CA
   */
  state?: string
  /**
   * @type string | undefined
   * @example 94301
   */
  zip?: string
}

export type ApiResponse = {
  /**
   * @type integer | undefined int32
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

export type Category = {
  /**
   * @type integer | undefined int64
   * @example 1
   */
  id?: number
  /**
   * @type string | undefined
   * @example Dogs
   */
  name?: string
}

export enum OrderStatus {
  'placed' = 'placed',
  'approved' = 'approved',
  'delivered' = 'delivered',
}
export enum OrderHttpStatus {
  'OrderHttpStatus_200' = 200,
  'OrderHttpStatus_400' = 400,
  'OrderHttpStatus_500' = 500,
}
export type Order = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number
  /**
   * @type integer | undefined int64
   * @example 198772
   */
  petId?: number
  /**
   * @type integer | undefined int32
   * @example 7
   */
  quantity?: number
  /**
   * @type string | undefined date-time
   */
  shipDate?: string
  /**
   * @description Order Status
   * @type string | undefined
   * @example approved
   */
  status?: OrderStatus
  /**
   * @description HTTP Status
   * @type number | undefined
   * @example 200
   */
  http_status?: OrderHttpStatus
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}

export type PetNotFound = {
  /**
   * @type integer | undefined int32
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

export type Tag = {
  /**
   * @type integer | undefined int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  name?: string
}

export type User = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number
  /**
   * @type string | undefined
   * @example theUser
   */
  username?: string
  /**
   * @type string | undefined
   * @example John
   */
  firstName?: string
  /**
   * @type string | undefined
   * @example James
   */
  lastName?: string
  /**
   * @type string | undefined
   * @example john@email.com
   */
  email?: string
  /**
   * @type string | undefined
   * @example 12345
   */
  password?: string
  /**
   * @type string | undefined
   * @example 12345
   */
  phone?: string
  /**
   * @description User Status
   * @type integer | undefined int32
   * @example 1
   */
  userStatus?: number
}

export type Customer = {
  /**
   * @type integer | undefined int64
   * @example 100000
   */
  id?: number
  /**
   * @type string | undefined
   * @example fehguy
   */
  username?: string
  /**
   * @type array | undefined
   */
  address?: Address[]
}

export type UserArray = User[]

export enum AddPetRequestStatus {
  'available' = 'available',
  'pending' = 'pending',
  'sold' = 'sold',
}
export type AddPetRequest = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number
  /**
   * @type string
   * @example doggie
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

export enum PetStatus {
  'available' = 'available',
  'pending' = 'pending',
  'sold' = 'sold',
}
export type Pet = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number
  /**
   * @type string
   * @example doggie
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

/**
 * @description Invalid ID supplied
 */
export type UpdatePet400 = any | null

/**
 * @description Pet not found
 */
export type UpdatePet404 = any | null

/**
 * @description Validation exception
 */
export type UpdatePet405 = any | null

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

export type AddPet405 = {
  /**
   * @type integer | undefined int32
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

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any | null

export enum FindPetsByStatusQueryParamsStatus {
  'available' = 'available',
  'pending' = 'pending',
  'sold' = 'sold',
}
export type FindPetsByStatusQueryParams =
  | {
    /**
     * @description Status values that need to be considered for filter
     * @type string | undefined
     * @default 'available'
     */
    status?: FindPetsByStatusQueryParamsStatus
  }
  | undefined

/**
 * @description successful operation
 */
export type FindPetsByStatusQueryResponse = Pet[]
export type FindPetsByStatusQuery = {
  Response: FindPetsByStatusQueryResponse
  QueryParams: FindPetsByStatusQueryParams
  Errors: FindPetsByStatus400
}

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any | null

export type FindPetsByTagsQueryParams =
  | {
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
  | undefined

/**
 * @description successful operation
 */
export type FindPetsByTagsQueryResponse = Pet[]
export type FindPetsByTagsQuery = {
  Response: FindPetsByTagsQueryResponse
  QueryParams: FindPetsByTagsQueryParams
  Errors: FindPetsByTags400
}

/**
 * @description Invalid ID supplied
 */
export type GetPetById400 = any | null

/**
 * @description Pet not found
 */
export type GetPetById404 = any | null

export type GetPetByIdPathParams = {
  /**
   * @description ID of pet to return
   * @type integer int64
   */
  petId: number
}

/**
 * @description successful operation
 */
export type GetPetByIdQueryResponse = Pet
export type GetPetByIdQuery = {
  Response: GetPetByIdQueryResponse
  PathParams: GetPetByIdPathParams
  Errors: GetPetById400 | GetPetById404
}

/**
 * @description Invalid input
 */
export type UpdatePetWithForm405 = any | null

export type UpdatePetWithFormMutationResponse = any | null

export type UpdatePetWithFormPathParams = {
  /**
   * @description ID of pet that needs to be updated
   * @type integer int64
   */
  petId: number
}

export type UpdatePetWithFormQueryParams =
  | {
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
  | undefined
export type UpdatePetWithFormMutation = {
  Response: UpdatePetWithFormMutationResponse
  PathParams: UpdatePetWithFormPathParams
  QueryParams: UpdatePetWithFormQueryParams
  Errors: UpdatePetWithForm405
}

/**
 * @description Invalid pet value
 */
export type DeletePet400 = any | null

export type DeletePetHeaderParams =
  | {
    /**
     * @type string | undefined
     */
    api_key?: string
  }
  | undefined

export type DeletePetMutationResponse = any | null

export type DeletePetPathParams = {
  /**
   * @description Pet id to delete
   * @type integer int64
   */
  petId: number
}
export type DeletePetMutation = {
  Response: DeletePetMutationResponse
  PathParams: DeletePetPathParams
  HeaderParams: DeletePetHeaderParams
  Errors: DeletePet400
}

export type UploadFileMutationRequest = string

export type UploadFilePathParams = {
  /**
   * @description ID of pet to update
   * @type integer int64
   */
  petId: number
}

export type UploadFileQueryParams =
  | {
    /**
     * @description Additional Metadata
     * @type string | undefined
     */
    additionalMetadata?: string
  }
  | undefined

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
export type GetInventoryQueryResponse = {
  [key: string]: number
}
export type GetInventoryQuery = {
  Response: GetInventoryQueryResponse
}

/**
 * @description Invalid input
 */
export type PlaceOrder405 = any | null

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
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any | null

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

/**
 * @description Invalid ID supplied
 */
export type GetOrderById400 = any | null

/**
 * @description Order not found
 */
export type GetOrderById404 = any | null

export type GetOrderByIdPathParams = {
  /**
   * @description ID of order that needs to be fetched
   * @type integer int64
   */
  orderId: number
}

/**
 * @description successful operation
 */
export type GetOrderByIdQueryResponse = Order
export type GetOrderByIdQuery = {
  Response: GetOrderByIdQueryResponse
  PathParams: GetOrderByIdPathParams
  Errors: GetOrderById400 | GetOrderById404
}

/**
 * @description Invalid ID supplied
 */
export type DeleteOrder400 = any | null

/**
 * @description Order not found
 */
export type DeleteOrder404 = any | null

export type DeleteOrderMutationResponse = any | null

export type DeleteOrderPathParams = {
  /**
   * @description ID of the order that needs to be deleted
   * @type integer int64
   */
  orderId: number
}
export type DeleteOrderMutation = {
  Response: DeleteOrderMutationResponse
  PathParams: DeleteOrderPathParams
  Errors: DeleteOrder400 | DeleteOrder404
}

export type CreateUserMutationResponse = any | null

/**
 * @description successful operation
 */
export type CreateUserError = User

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User
export type CreateUserMutation = {
  Response: CreateUserMutationResponse
  Request: CreateUserMutationRequest
  Errors: CreateUserError
}

/**
 * @description successful operation
 */
export type CreateUsersWithListInputError = any | null

export type CreateUsersWithListInputMutationRequest = User[]

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputMutationResponse = User
export type CreateUsersWithListInputMutation = {
  Response: CreateUsersWithListInputMutationResponse
  Request: CreateUsersWithListInputMutationRequest
  Errors: CreateUsersWithListInputError
}

/**
 * @description Invalid username/password supplied
 */
export type LoginUser400 = any | null

export type LoginUserQueryParams =
  | {
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
  | undefined

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
export type LogoutUserError = any | null

export type LogoutUserQueryResponse = any | null
export type LogoutUserQuery = {
  Response: LogoutUserQueryResponse
  Errors: LogoutUserError
}

/**
 * @description Invalid username supplied
 */
export type GetUserByName400 = any | null

/**
 * @description User not found
 */
export type GetUserByName404 = any | null

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
export type GetUserByNameQueryResponse = User
export type GetUserByNameQuery = {
  Response: GetUserByNameQueryResponse
  PathParams: GetUserByNamePathParams
  Errors: GetUserByName400 | GetUserByName404
}

/**
 * @description successful operation
 */
export type UpdateUserError = any | null

export type UpdateUserMutationResponse = any | null

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = User
export type UpdateUserMutation = {
  Response: UpdateUserMutationResponse
  Request: UpdateUserMutationRequest
  PathParams: UpdateUserPathParams
  Errors: UpdateUserError
}

/**
 * @description Invalid username supplied
 */
export type DeleteUser400 = any | null

/**
 * @description User not found
 */
export type DeleteUser404 = any | null

export type DeleteUserMutationResponse = any | null

export type DeleteUserPathParams = {
  /**
   * @description The name that needs to be deleted
   * @type string
   */
  username: string
}
export type DeleteUserMutation = {
  Response: DeleteUserMutationResponse
  PathParams: DeleteUserPathParams
  Errors: DeleteUser400 | DeleteUser404
}
