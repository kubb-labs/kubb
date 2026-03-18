export type createPetsPathName = number

/**
 * @description Null response
 */
export type createPetsStatus201 = object

/**
 * @description Unexpected error
 */
export type createPetsStatusDefault = object

export type createPetsRequestConfig = {
  data?: never
  pathParams: {
    fullName?: string
  }
  queryParams?: never
  headerParams?: never
  url: '/pets'
}

export type createPetsResponses = {
  '201': createPetsStatus201
  default: createPetsStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type createPetsResponse = createPetsStatus201 | createPetsStatusDefault
