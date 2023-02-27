import { uploadObject } from '../../aws'

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { body } = req
      const signedUrl = await uploadObject(body.input)

      res.status(200).json({ url: signedUrl })
      return
    }
    res.status(200).send(undefined)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err?.message || err })
  }
}
