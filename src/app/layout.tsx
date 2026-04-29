import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '相册',
  description: '上传照片并配文',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
