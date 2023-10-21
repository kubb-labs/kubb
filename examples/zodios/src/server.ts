import { zodiosContext } from '@zodios/express'
import cors from 'cors'
import express from 'express'
import z from 'zod'

import { api } from './gen/zodios.ts'

const app = zodiosContext(
  z.object({
    user: z.any(),
  }),
).app(api.api, {
  express: express(),
})

app.get('/pet/:petId', (req, res) => {
  res.json({
    name: req.params.petId?.toString(),
    photoUrls: [],
  })
})

app.use(cors())

app.listen(3000, () => {})
