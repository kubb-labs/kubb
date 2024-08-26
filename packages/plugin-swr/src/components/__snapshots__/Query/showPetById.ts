type ShowPetByIdClient = typeof client<ShowPetByIdQueryResponse, never, never>

type ShowPetById = 
            {
              data: ShowPetByIdQueryResponse
              error: never
              request: never
              pathParams: ShowPetByIdPathParams
              queryParams: never
              headerParams: never
              response: ShowPetByIdQueryResponse
              client: {
                parameters: Partial<Parameters<ShowPetByIdClient>[0]>
                return: Awaited<ReturnType<ShowPetByIdClient>>
              }
            }

export function ShowPetByIdQueryOptions<TData = ShowPetById['response']>(petId: ShowPetByIdPathParams["petId"], testId: ShowPetByIdPathParams["testId"], options: ShowPetById['client']['parameters'] = {}): SWRConfiguration<TData, ShowPetById['error']> {
  
          return {
            fetcher: async () => {
              
              const res = await client<TData, ShowPetById['error']>({
                    method: "get",
        url: `/pets/${petId}`,
        ...options
              })
    
             return res.data
            },
          }
    
           
}