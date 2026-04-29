import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasAccountId: !!process.env.R2_ACCOUNT_ID,
    hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    hasBucket: !!process.env.R2_BUCKET_NAME,
    hasPublicUrl: !!process.env.R2_PUBLIC_URL,
    publicUrl: process.env.R2_PUBLIC_URL || 'not set',
    bucket: process.env.R2_BUCKET_NAME || 'not set',
  })
}
