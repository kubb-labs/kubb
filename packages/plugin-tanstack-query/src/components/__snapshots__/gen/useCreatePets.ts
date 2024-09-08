type CreatePetsClient = typeof client<CreatePetsMutationResponse, never, CreatePetsMutationRequest>

type CreatePets = 
          {
            data: CreatePetsMutationResponse
            error: never
            request: CreatePetsMutationRequest
            pathParams: CreatePetsPathParams
            queryParams: CreatePetsQueryParams
            headerParams: CreatePetsHeaderParams
            response: CreatePetsMutationResponse
            client: {
              parameters: Partial<Parameters<CreatePetsClient>[0]>
              return: Awaited<ReturnType<CreatePetsClient>>
            }
          }

/**
 * @summary Create a pet
 * @link /pets/:uuid
 */
export function useCreatePets(uuid: CreatePetsPathParams["uuid"], headers: CreatePets['headerParams'], params?: CreatePets['queryParams'], options: {
        mutation?: UseMutationOptions<CreatePets["response"], CreatePets["error"], CreatePets["request"]>,
        client?: CreatePets['client']['parameters']
    } = {}) {
  
           const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}
  
           return useMutation({
             mutationFn: async(data) => {
               
               
               const res = await client<CreatePets["data"], CreatePets["error"], CreatePets["request"]>({
                    method: "post",
      url: `/pets/${uuid}`,
      params,
      data,
      headers: { ...headers, ...clientOptions.headers },
      ...clientOptions
               })
  
               return res.data
             },
             ...mutationOptions
           })
}