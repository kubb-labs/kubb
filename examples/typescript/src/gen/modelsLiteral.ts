export type OrderStatusEnum = 'placed' | 'approved' | 'delivered'

export type OrderHttpStatusEnum = 200 | 400 | 500

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
  status?: OrderStatusEnum
  /**
   * @description HTTP Status
   * @type number | undefined
   */
  http_status?: OrderHttpStatusEnum
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

export type PetTypeEnum = 'dog' | 'cat'

export type PetStatusEnum = 'available' | 'pending' | 'sold'

export type Pet =
  | (Dog & {
      /**
       * @type integer | undefined, int64
       */
      id?: number
      /**
       * @type string | undefined
       */
      readonly type?: PetTypeEnum
      /**
       * @type string
       */
      name: string
      /**
       * @type object | undefined
       */
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
      status?: PetStatusEnum
    })
  | (Cat & {
      /**
       * @type integer | undefined, int64
       */
      id?: number
      /**
       * @type string | undefined
       */
      readonly type?: PetTypeEnum
      /**
       * @type string
       */
      name: string
      /**
       * @type object | undefined
       */
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
      status?: PetStatusEnum
    })

export type CatTypeEnum = 'cat'

export type Cat = {
  /**
   * @type string
   */
  readonly type: CatTypeEnum
  /**
   * @type string | undefined
   */
  name?: string
}

export type DogTypeEnum = 'dog'

export type Dog = {
  /**
   * @type string
   */
  readonly type: DogTypeEnum
  /**
   * @type string | undefined
   */
  bark?: string
}

export type AddPetRequestStatusEnum = 'available' | 'pending' | 'sold'

export type AddPetRequest = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string
   */
  name: string
  /**
   * @type object | undefined
   */
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
  status?: AddPetRequestStatusEnum
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
export type UpdatePetMutationRequest = Omit<NonNullable<Pet>, 'type'>

export type UpdatePetMutationResponse = UpdatePet200

export type UpdatePetMutation = {
  Response: UpdatePet200
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

export type AddPetMutationResponse = AddPet200

export type AddPetMutation = {
  Response: AddPet200
  Request: AddPetMutationRequest
  Errors: AddPet405
}

export type FindPetsByStatusQueryParamsStatusEnum = 'available' | 'pending' | 'sold'

export type FindPetsByStatusQueryParams = {
  /**
   * @description Status values that need to be considered for filter
   * @default "available"
   * @type string | undefined
   */
  status?: FindPetsByStatusQueryParamsStatusEnum
}

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any

export type FindPetsByStatusQueryResponse = FindPetsByStatus200

export type FindPetsByStatusQuery = {
  Response: FindPetsByStatus200
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

export type FindPetsByTagsQueryResponse = FindPetsByTags200

export type FindPetsByTagsQuery = {
  Response: FindPetsByTags200
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

export type GetPetByIdQueryResponse = GetPetById200

export type GetPetByIdQuery = {
  Response: GetPetById200
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
  Response: any
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
  Response: any
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

export type UploadFileMutationResponse = UploadFile200

export type UploadFileMutation = {
  Response: UploadFile200
  Request: UploadFileMutationRequest
  PathParams: UploadFilePathParams
  QueryParams: UploadFileQueryParams
  Errors: any
}

/**
 * @description successful operation
 */
export type GetInventory200 = {
  [key: string]: number
}

export type GetInventoryQueryResponse = GetInventory200

export type GetInventoryQuery = {
  Response: GetInventory200
  Errors: any
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

export type PlaceOrderMutationResponse = PlaceOrder200

export type PlaceOrderMutation = {
  Response: PlaceOrder200
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

export type PlaceOrderPatchMutationResponse = PlaceOrderPatch200

export type PlaceOrderPatchMutation = {
  Response: PlaceOrderPatch200
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

export type GetOrderByIdQueryResponse = GetOrderById200

export type GetOrderByIdQuery = {
  Response: GetOrderById200
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
  Response: any
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
  Response: any
  Request: CreateUserMutationRequest
  Errors: any
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

export type CreateUsersWithListInputMutationResponse = CreateUsersWithListInput200

export type CreateUsersWithListInputMutation = {
  Response: CreateUsersWithListInput200
  Request: CreateUsersWithListInputMutationRequest
  Errors: any
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

export type LoginUserQueryResponse = LoginUser200

export type LoginUserQuery = {
  Response: LoginUser200
  QueryParams: LoginUserQueryParams
  Errors: LoginUser400
}

/**
 * @description successful operation
 */
export type LogoutUserError = any

export type LogoutUserQueryResponse = any

export type LogoutUserQuery = {
  Response: any
  Errors: any
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

export type GetUserByNameQueryResponse = GetUserByName200

export type GetUserByNameQuery = {
  Response: GetUserByName200
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
  Response: any
  Request: UpdateUserMutationRequest
  PathParams: UpdateUserPathParams
  Errors: any
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
  Response: any
  PathParams: DeleteUserPathParams
  Errors: DeleteUser400 | DeleteUser404
}
