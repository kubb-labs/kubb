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

export const addPetRequestStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type AddPetRequestStatus = (typeof addPetRequestStatus)[keyof typeof addPetRequestStatus]
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

export const petStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type PetStatus = (typeof petStatus)[keyof typeof petStatus]
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

/**
 * @description Invalid status value
 */
export type FindPetsByStatus400 = any | null

export const findPetsByStatusQueryParamsStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type FindPetsByStatusQueryParamsStatus = (typeof findPetsByStatusQueryParamsStatus)[keyof typeof findPetsByStatusQueryParamsStatus]
export type FindPetsByStatusQueryParams = {
  /**
   * @description Status values that need to be considered for filter
   * @type string | undefined
   * @default 'available'
   */
  status?: FindPetsByStatusQueryParamsStatus
}

/**
 * @description successful operation
 */
export type FindPetsByStatusQueryResponse = Pet[]

/**
 * @description Invalid tag value
 */
export type FindPetsByTags400 = any | null

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
export type FindPetsByTagsQueryResponse = Pet[]

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
 * @description Invalid pet value
 */
export type DeletePet400 = any | null

export type DeletePetMutationResponse = any | null

export type DeletePetPathParams = {
  /**
   * @description Pet id to delete
   * @type integer int64
   */
  petId: number
}

export type UploadFileMutationRequest = string

export type UploadFilePathParams = {
  /**
   * @description ID of pet to update
   * @type integer int64
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
export type UploadFileMutationResponse = ApiResponse

/**
 * @description successful operation
 */
export type GetInventoryQueryResponse = {
  [key: string]: number
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

/**
 * @description Invalid input
 */
export type PlaceOrderPatch405 = any | null

export type PlaceOrderPatchMutationRequest = Order

/**
 * @description successful operation
 */
export type PlaceOrderPatchMutationResponse = Order

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

export type CreateUserMutationResponse = any | null

/**
 * @description successful operation
 */
export type CreateUserError = User

/**
 * @description Created user object
 */
export type CreateUserMutationRequest = User

/**
 * @description successful operation
 */
export type CreateUsersWithListInputError = any | null

export type CreateUsersWithListInputMutationRequest = User[]

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputMutationResponse = User

/**
 * @description Invalid username/password supplied
 */
export type LoginUser400 = any | null

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
export type LoginUserQueryResponse = string

/**
 * @description successful operation
 */
export type LogoutUserError = any | null

export type LogoutUserQueryResponse = any | null

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
