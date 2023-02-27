import express from 'express'
import next from 'next'
import dotenv from 'dotenv'
import { S3Client } from '@aws-sdk/client-s3'

import { buildKubbFiles } from './pages/api/parse'
import { uploadObject } from './aws'

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000
const app = next({ dev })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = express()
    if (dev) {
      dotenv.config({ path: '.env.local' })
    }

    server.use(express.json({ limit: '50mb' }))

    const s3Client = new S3Client({
      region: 'eu-west-1',
      credentials: { accessKeyId: process.env.ACCESS_KEY!, secretAccessKey: process.env.SECRET_ACCESS_KEY! },
    })

    server.post('/api/upload', async (req, res) => {
      const { body } = req

      const signedUrl = await uploadObject(body.input, { client: s3Client })

      return res.status(200).json({ url: signedUrl })
    })

    server.post('/api/parse', async (req, res) => {
      const { body } = req

      const files = await buildKubbFiles(body.config)

      return res.status(200).json(files)
    })

    server.get('*', (req, res) => {
      return handle(req, res)
    })

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`)
    })
  })
  .catch((ex) => {
    console.error(ex.stack)
    process.exit(1)
  })
