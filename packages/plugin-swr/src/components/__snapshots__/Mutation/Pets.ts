type CreatePetsClient = typeof client<CreatePetsMutationResponse, never, CreatePetsMutationRequest>

type CreatePets = 
            {
              data: CreatePetsMutationResponse
              error: never
              request: CreatePetsMutationRequest
              pathParams: never
              queryParams: never
              headerParams: never
              response: CreatePetsMutationResponse
              client: {
                parameters: Partial<Parameters<CreatePetsClient>[0]>
                return: Awaited<ReturnType<CreatePetsClient>>
              }
            }

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets(options?: {
            mutation?: SWRMutationConfiguration<CreatePets["response"], CreatePets["error"]>,
            client?: CreatePets['client']['parameters'],
            shouldFetch?: boolean,
          }): SWRMutationResponse<CreatePets["response"], CreatePets["error"]> {
  
           const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
    
           const url = `/pets` as const
           return useSWRMutation<CreatePets["response"], CreatePets["error"], Key>(
            shouldFetch ? url : null,
            async (_url, { arg: data }) => {
              const res = await client<CreatePets["data"], CreatePets["error"], CreatePets["request"]>({
                    method: "post",
        url,
        data,
        ...clientOptions
              })
    
              return res.data
            },
            mutationOptions
          )
        
}