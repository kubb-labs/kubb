import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

import type { PutObjectCommandInput } from '@aws-sdk/client-s3'

export const s3Client = new S3Client({
  region: 'eu-west-1',
  credentials: { accessKeyId: process.env.ACCESS_KEY!, secretAccessKey: process.env.SECRET_ACCESS_KEY! },
})

export const uploadObject = async (data: any, options: { client: S3Client } = { client: s3Client }) => {
  const date = new Date()
  date.setHours(date.getMinutes() + 5)
  const bucketParams: PutObjectCommandInput = {
    Bucket: 'kubb',
    Key: `${uuidv4()}.json`,
    Body: data,
    Expires: date,
    ContentDisposition: 'inline',
  }

  try {
    const command = new PutObjectCommand(bucketParams)
    await options.client.send(command)

    // Create the presigned URL.
    const signedUrl = `https://kubb.s3.eu-west-1.amazonaws.com/${bucketParams.Key}`

    const response = await fetch(signedUrl)
    console.log(`\nResponse returned by signed URL: ${await response.text()}\n`)
    console.log(signedUrl)

    return signedUrl
  } catch (err) {
    console.log('Error', err)
  }

  return null
}
