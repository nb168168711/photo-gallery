import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { photoId, userId } = await request.json()
    
    if (!photoId || !userId) {
      return NextResponse.json({ error: '参数缺失' }, { status: 400 })
    }

    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 })
    }

    if (photo.user_id !== userId) {
      return NextResponse.json({ error: '无权删除' }, { status: 403 })
    }

    if (photo.image_url) {
      const fileName = photo.image_url.split('/').pop()
      if (fileName) {
        await fetch(`${request.nextUrl.origin}/api/upload`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName }),
        })
      }
    }

    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      return NextResponse.json({ error: '删除失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete photo error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
