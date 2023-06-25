import { setupWorker, rest } from 'msw'

const worker = setupWorker(
  rest.get('/pets', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1234',
          name: 'Lily',
        },
      ])
    )
  })
)
worker.start()
