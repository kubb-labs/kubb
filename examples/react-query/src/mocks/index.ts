import { rest, setupWorker } from 'msw'

export const worker = setupWorker(
  rest.get('/pet/findByStatus', (req, res, ctx) => {
    if (req.url.searchParams.get('status') === 'pending') {
      return res(
        ctx.json([
          {
            id: '1234',
            name: 'Lily(pending)',
          },
        ]),
      )
    }

    return res(
      ctx.json([
        {
          id: '1234',
          name: 'Lily',
        },
      ]),
    )
  }),
)
