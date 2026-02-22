import type { ResponseErrorConfig } from './test/.kubb/fetch'
import { fetch } from './test/.kubb/fetch'

/**
 * @summary Info for a specific pet
 * {@link /pets/:petId}
 */
export async function showPetByIdHandler({ petId, testId }: { petId: ShowPetByIdPathParams['petId']; testId: ShowPetByIdPathParams['testId'] }) {
  const res = await fetch<ShowPetByIdQueryResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets/${petId}` })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
