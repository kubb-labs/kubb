export type deletePetPathPetId = string

export type deletePetRequestConfig = {
  data?: never
  pathParams: {
    petId: deletePetPathPetId
  }
  queryParams?: never
  headerParams?: never
  url: `/pets/${string}`
}
