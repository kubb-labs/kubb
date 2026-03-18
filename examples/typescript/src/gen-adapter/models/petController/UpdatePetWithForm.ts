export type UpdatePetWithFormPathPetId = number

export type UpdatePetWithFormQueryName = string

export type UpdatePetWithFormQueryStatus = string

export interface UpdatePetWithFormRequestConfig {
  data?: never
  pathParams: {
    petId: UpdatePetWithFormPathPetId
  }
  queryParams?: {
    name?: UpdatePetWithFormQueryName
    status?: UpdatePetWithFormQueryStatus
  }
  headerParams?: never
  url: `/pet/${string}`
}
