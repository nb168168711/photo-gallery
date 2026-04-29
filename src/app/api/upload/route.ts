import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log('R2 Config:', {
      accountId: process.env.R2_ACCOUNT_ID,
      bucket: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.R2_PUBLIC_URL,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    })

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const isGif = ext === 'gif'
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'tiff'].includes(ext)
    
    let finalBuffer = buffer
    let finalExt = ext
    let contentType = file.type || 'application/octet-stream'

    if (isImage && !isGif) {
      try {
        finalBuffer = await sharp(buffer)
          .resize(2000, 2000, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85,
            mozjpeg: true
          })
          .toBuffer()
        finalExt = 'jpg'
        contentType = 'image/jpeg'
      } catch (sharpError) {
        console.error('Sharp compression failed, using original:', sharpError)
      }
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${finalExt}`

    console.log('Uploading to R2:', fileName)

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: finalBuffer,
      ContentType: contentType,
    }))

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`

    console.log('Upload success:', publicUrl)

    return NextResponse.json({ url: publicUrl, fileName })
  } catch (error: any) {
    console.error('Upload error details:', error.message, error.stack)
    return NextResponse.json({ error: '上传失败', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileName } = await request.json()
    
    if (!fileName) {
      return NextResponse.json({ error: '文件名缺失' }, { status: 400 })
    }

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
    }))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
