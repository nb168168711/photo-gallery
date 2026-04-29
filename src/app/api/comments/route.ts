import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { commentId, userId } = await request.json()
    
    if (!commentId || !userId) {
      return NextResponse.json({ error: '参数缺失' }, { status: 400 })
    }

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 })
    }

    if (comment.user_id !== userId) {
      return NextResponse.json({ error: '无权删除' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      return NextResponse.json({ error: '删除失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
