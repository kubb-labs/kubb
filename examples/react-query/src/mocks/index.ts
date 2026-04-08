import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'

export const worker = setupWorker(
  http.get('/pet/findByStatus', ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('status') === 'pending') {
      return HttpResponse.json([
        {
          id: '1234',
          name: 'Lily(pending)',
        },
      ])
    }

    return HttpResponse.json([
      {
        id: '1234',
        name: 'Lily',
      },
    ])
  }),
)
