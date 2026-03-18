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

export interface UpdatePetData {
  data?: UpdatePetMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export interface UpdatePetResponses {
  '200': UpdatePet200
}

export type UpdatePetResponse = UpdatePet200

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

export interface AddPetData {
  data?: AddPetMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

export interface AddPetResponses {
  '200': AddPet200
  '405': AddPet405
}

export type AddPetResponse = AddPet200 | AddPet405

/**
 * @default available
 */
export type FindPetsByStatusStatus = 'available' | 'pending' | 'sold'

/**
 * @description successful operation
 */
export type FindPetsByStatus200 = Pet[]

export interface FindPetsByStatusData {
  data?: never
  pathParams?: never
  queryParams?: {
    status?: FindPetsByStatusStatus
  }
  headerParams?: never
  url: '/pet/findByStatus'
}

export interface FindPetsByStatusResponses {
  '200': FindPetsByStatus200
}

export type FindPetsByStatusResponse = FindPetsByStatus200

export type FindPetsByTagsTags = string[]

/**
 * @description successful operation
 */
export type FindPetsByTags200 = Pet[]

export interface FindPetsByTagsData {
  data?: never
  pathParams?: never
  queryParams?: {
    tags?: FindPetsByTagsTags
  }
  headerParams?: never
  url: '/pet/findByTags'
}

export interface FindPetsByTagsResponses {
  '200': FindPetsByTags200
}

export type FindPetsByTagsResponse = FindPetsByTags200

export type GetPetByIdPetId = number

/**
 * @description successful operation
 */
export type GetPetById200 = Pet

export interface GetPetByIdData {
  data?: never
  pathParams: {
    petId: GetPetByIdPetId
  }
  queryParams?: never
  headerParams?: never
  url: `/pet/${string}`
}

export interface GetPetByIdResponses {
  '200': GetPetById200
}

export type GetPetByIdResponse = GetPetById200

export type UpdatePetWithFormPetId = number

export type UpdatePetWithFormName = string

export type UpdatePetWithFormStatus = string

export interface UpdatePetWithFormData {
  data?: never
  pathParams: {
    petId: UpdatePetWithFormPetId
  }
  queryParams?: {
    name?: UpdatePetWithFormName
    status?: UpdatePetWithFormStatus
  }
  headerParams?: never
  url: `/pet/${string}`
}

export type DeletePetApiKey = string

export type DeletePetPetId = number

/**
 * @description items
 */
export type DeletePet200 = ('TYPE1' | 'TYPE2' | 'TYPE3')[]

export interface DeletePetData {
  data?: never
  pathParams: {
    petId: DeletePetPetId
  }
  queryParams?: never
  headerParams?: {
    api_key?: DeletePetApiKey
  }
  url: `/pet/${string}`
}

export interface DeletePetResponses {
  '200': DeletePet200
}

export type DeletePetResponse = DeletePet200

export type UploadFilePetId = number

export type UploadFileAdditionalMetadata = string

/**
 * @description successful operation
 */
export type UploadFile200 = ApiResponse

export type UploadFileMutationRequest = Blob

export interface UploadFileData {
  data?: UploadFileMutationRequest
  pathParams: {
    petId: UploadFilePetId
  }
  queryParams?: {
    additionalMetadata?: UploadFileAdditionalMetadata
  }
  headerParams?: never
  url: `/pet/${string}/uploadImage`
}

export interface UploadFileResponses {
  '200': UploadFile200
}

export type UploadFileResponse = UploadFile200

/**
 * @description successful operation
 */
export interface GetInventory200 {
  [key: string]: number
}

export interface GetInventoryData {
  data?: never
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/inventory'
}

export interface GetInventoryResponses {
  '200': GetInventory200
}

export type GetInventoryResponse = GetInventory200

/**
 * @description successful operation
 */
export type PlaceOrder200 = Order

/**
 * @description Order description
 */
export type PlaceOrderMutationRequest = Order

export interface PlaceOrderData {
  data?: PlaceOrderMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/order'
}

export interface PlaceOrderResponses {
  '200': PlaceOrder200
}

export type PlaceOrderResponse = PlaceOrder200

/**
 * @description successful operation
 */
export type PlaceOrderPatch200 = Order

export type PlaceOrderPatchMutationRequest = Order

export interface PlaceOrderPatchData {
  data?: PlaceOrderPatchMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/order'
}

export interface PlaceOrderPatchResponses {
  '200': PlaceOrderPatch200
}

export type PlaceOrderPatchResponse = PlaceOrderPatch200

export type GetOrderByIdOrderId = number

/**
 * @description successful operation
 */
export type GetOrderById200 = Order

export interface GetOrderByIdData {
  data?: never
  pathParams: {
    orderId: GetOrderByIdOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}

export interface GetOrderByIdResponses {
  '200': GetOrderById200
}

export type GetOrderByIdResponse = GetOrderById200

export type DeleteOrderOrderId = number

export interface DeleteOrderData {
  data?: never
  pathParams: {
    orderId: DeleteOrderOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}

/**
 * @description successful operation
 */
export type CreateUserDefault = User

export type CreateUserMutationRequest = User

export interface CreateUserData {
  data?: CreateUserMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/user'
}

export interface CreateUserResponses {
  default: CreateUserDefault
}

export type CreateUserResponse = CreateUserDefault

/**
 * @description Successful operation
 */
export type CreateUsersWithListInput200 = User

export type CreateUsersWithListInputMutationRequest = User[]

export interface CreateUsersWithListInputData {
  data?: CreateUsersWithListInputMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/user/createWithList'
}

export interface CreateUsersWithListInputResponses {
  '200': CreateUsersWithListInput200
}

export type CreateUsersWithListInputResponse = CreateUsersWithListInput200

export type LoginUserUsername = string

export type LoginUserPassword = string

/**
 * @description successful operation
 */
export type LoginUser200 = string

export interface LoginUserData {
  data?: never
  pathParams?: never
  queryParams?: {
    username?: LoginUserUsername
    password?: LoginUserPassword
  }
  headerParams?: never
  url: '/user/login'
}

export interface LoginUserResponses {
  '200': LoginUser200
}

export type LoginUserResponse = LoginUser200

export interface LogoutUserData {
  data?: never
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/user/logout'
}

export type GetUserByNameUsername = string

/**
 * @description successful operation
 */
export type GetUserByName200 = User

export interface GetUserByNameData {
  data?: never
  pathParams: {
    username: GetUserByNameUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}

export interface GetUserByNameResponses {
  '200': GetUserByName200
}

export type GetUserByNameResponse = GetUserByName200

export type UpdateUserUsername = string

export type UpdateUserMutationRequest = User

export interface UpdateUserData {
  data?: UpdateUserMutationRequest
  pathParams: {
    username: UpdateUserUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}

export type DeleteUserUsername = string | null

export interface DeleteUserData {
  data?: never
  pathParams: {
    username: DeleteUserUsername
  }
  queryParams?: never
  headerParams?: never
  url: `/user/${string}`
}
