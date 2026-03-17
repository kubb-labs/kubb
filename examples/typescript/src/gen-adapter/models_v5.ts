export enum OrderParamsStatusEnum {
  placed = 'placed',
  approved = 'approved',
  delivered = 'delivered',
}

export enum OrderHttpStatusEnum {
  OrderHttpStatusEnum_200 = 200,
  OrderHttpStatusEnum_400 = 400,
  OrderHttpStatusEnum_500 = 500,
}

export interface Order {
  /**
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @example 198772
   * @type integer | undefined
   */
  petId?: number
  /**
   * @type object | undefined
   */
  params?: {
    /**
     * @description Order Status
     * @example approved
     * @type string
     */
    status: OrderParamsStatusEnum
    /**
     * @type string
     */
    type: string
  }
  /**
   * @example 7
   * @type integer | undefined
   */
  quantity?: number
  /**
   * @type string | undefined
   */
  shipDate?: string
  /**
   * @description Order Status
   */
  status?: string
  /**
   * @description HTTP Status
   * @example 200
   * @type number | undefined
   */
  http_status?: OrderHttpStatusEnum
  /**
   * @type boolean | undefined
   */
  complete?: boolean
}

export interface Address {
  /**
   * @type string | undefined
   */
  streetName?: string
  /**
   * @type string | undefined
   */
  streetNumber?: string
  /**
   * @example Palo Alto
   * @type string | undefined
   */
  city?: string
  /**
   * @example CA
   * @type string | undefined
   */
  state?: string
  /**
   * @example 94301
   * @type string | undefined
   */
  zip?: string
}

export enum CustomerParamsStatusEnum {
  placed = 'placed',
  approved = 'approved',
  delivered = 'delivered',
}

export interface Customer {
  /**
   * @example 100000
   * @type integer | undefined
   */
  id?: number
  /**
   * @type object | undefined
   */
  params?: {
    /**
     * @description Order Status
     * @example approved
     * @type string
     */
    status: CustomerParamsStatusEnum
    /**
     * @type string
     */
    type: string
  }
  /**
   * @example fehguy
   * @type string | undefined
   */
  username?: string
  /**
   * @type array | undefined
   */
  address?: Address[]
}

export type HappyCustomer = Customer & {
  /**
   * @type boolean | undefined
   */
  isHappy?: true
}

export type UnhappyCustomer = Customer & {
  /**
   * @type string | undefined
   */
  reasonToBeUnhappy?: string
  /**
   * @type boolean | undefined
   */
  isHappy?: false
}

export interface Category {
  /**
   * @example 1
   * @type integer | undefined
   */
  id?: number
  /**
   * @example Dogs
   * @type string | undefined
   */
  name?: string
}

export interface User {
  /**
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @example theUser
   * @type string | undefined
   */
  username?: string
  /**
   * @example John
   * @type string | undefined
   */
  firstName?: string
  /**
   * @example James
   * @type string | undefined
   */
  lastName?: string
  /**
   * @example john@email.com
   * @type string | undefined
   */
  email?: string
  /**
   * @example 12345
   * @type string | undefined
   */
  password?: string
  /**
   * @example 12345
   * @type string | undefined
   */
  phone?: string
  /**
   * @description User Status
   * @example 1
   * @type integer | undefined
   */
  userStatus?: number
}

export interface Tag {
  /**
   * @type integer | undefined
   */
  id?: number
  /**
   * @type string | undefined
   */
  name?: string
}

export interface Dog {
  /**
   * @minLength 1
   * @type string | undefined
   */
  readonly type?: string
  /**
   * @type string | undefined
   */
  bark?: string
}

export interface Cat {
  /**
   * @minLength 1
   * @type string | undefined
   */
  readonly type?: string
  /**
   * @type string | undefined
   */
  name?: string
}

export enum PetStatusEnum {
  available = 'available',
  pending = 'pending',
  sold = 'sold',
}

export type Pet =
  | (Dog & {
      /**
       * @example 10
       * @type integer | undefined
       */
      id?: number
      /**
       * @type string
       */
      readonly type: 'dog'
      /**
       * @example doggie
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
      readonly tags?: Tag[]
      /**
       * @description pet status in the store
       * @type string | undefined
       */
      status?: PetStatusEnum
    })
  | (Cat & {
      /**
       * @example 10
       * @type integer | undefined
       */
      id?: number
      /**
       * @type string
       */
      readonly type: 'cat'
      /**
       * @example doggie
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
      readonly tags?: Tag[]
      /**
       * @description pet status in the store
       * @type string | undefined
       */
      status?: PetStatusEnum
    })

export type FullAddress = Address & {
  /**
   * @type string
   */
  streetNumber: string
  /**
   * @type string
   */
  streetName: string
}

export enum AddPetRequestStatusEnum {
  available = 'available',
  pending = 'pending',
  sold = 'sold',
  'in store' = 'in store',
}

export interface AddPetRequest {
  /**
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @example doggie
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
  status?: AddPetRequestStatusEnum
}

export type ApiResponse = {
  /**
   * @type integer | undefined
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

export interface PetNotFound {
  /**
   * @type integer | undefined
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

export type UpdatePetMutationRequest = Pet

/**
 * @description Successful operation
 */
export type AddPet200 = Pet

/**
 * @description Pet not found
 */
export interface AddPet405 {
  /**
   * @type integer | undefined
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

export type AddPetMutationRequest = AddPetRequest

/**
 * @default available
 */
export type FindPetsByStatusStatus = 'available' | 'pending' | 'sold'

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

export type FindPetsByTagsTags = string[]

/**
 * @description successful operation
 */
export type FindPetsByTags200 = Pet[]

export type GetPetByIdPetId = number

/**
 * @description successful operation
 */
export type GetPetById200 = Pet

export type UpdatePetWithFormPetId = number

export type UpdatePetWithFormName = string

export type UpdatePetWithFormStatus = string

export type DeletePetApiKey = string

export type DeletePetPetId = number

/**
 * @description items
 */
export type DeletePet200 = ('TYPE1' | 'TYPE2' | 'TYPE3')[]

export type UploadFilePetId = number

export type UploadFileAdditionalMetadata = string

/**
 * @description successful operation
 */
export type UploadFile200 = ApiResponse

export type UploadFileMutationRequest = Blob

/**
 * @description successful operation
 */
export interface GetInventory200 {
  [key: string]: number
}

/**
 * @description successful operation
 */
export type PlaceOrder200 = Order

/**
 * @description Order description
 */
export type PlaceOrderMutationRequest = Order

/**
 * @description successful operation
 */
export type PlaceOrderPatch200 = Order

export type PlaceOrderPatchMutationRequest = Order

export type GetOrderByIdOrderId = number

/**
 * @description successful operation
 */
export type GetOrderById200 = Order

export type DeleteOrderOrderId = number

/**
 * @description successful operation
 */
export type CreateUserDefault = User

export type CreateUserMutationRequest = User

/**
 * @description Successful operation
 */
export type CreateUsersWithListInput200 = User

export type CreateUsersWithListInputMutationRequest = User[]

export type LoginUserUsername = string

export type LoginUserPassword = string

/**
 * @description successful operation
 */
export type LoginUser200 = string

export type GetUserByNameUsername = string

/**
 * @description successful operation
 */
export type GetUserByName200 = User

export type UpdateUserUsername = string

export type UpdateUserMutationRequest = User

export type DeleteUserUsername = string | null
