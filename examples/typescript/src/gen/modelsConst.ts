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
 * @description successful operation
 */
export type GetInventoryQueryResponse = {
  [key: string]: number
}

export namespace GetInventoryQuery {
  export type Response = GetInventoryQueryResponse
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

export namespace PlaceOrderMutation {
  export type Response = PlaceOrderMutationResponse
  export type Request = PlaceOrderMutationRequest
  export type Errors = PlaceOrder405
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

export namespace PlaceOrderPatchMutation {
  export type Response = PlaceOrderPatchMutationResponse
  export type Request = PlaceOrderPatchMutationRequest
  export type Errors = PlaceOrderPatch405
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

export namespace GetOrderByIdQuery {
  export type Response = GetOrderByIdQueryResponse
  export type PathParams = GetOrderByIdPathParams
  export type Errors = GetOrderById400 | GetOrderById404
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

export namespace DeleteOrderMutation {
  export type Response = DeleteOrderMutationResponse
  export type PathParams = DeleteOrderPathParams
  export type Errors = DeleteOrder400 | DeleteOrder404
}
