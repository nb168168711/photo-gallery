'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Camera, Upload, X, LogOut, Image as ImageIcon, 
  MessageSquare, Heart, MapPin, Calendar, Activity,
  Plus, User, Grid3X3, LayoutGrid, Send, ChevronDown, Trash2
} from 'lucide-react'

interface Photo {
  id: string
  image_url: string
  caption: string
  photo_date: string
  location: string
  activity: string
  created_at: string
  user_id: string
  user_name?: string
}

interface Comment {
  id: string
  photo_id: string
  user_id: string
  content: string
  created_at: string
  user_name?: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [photoDate, setPhotoDate] = useState('')
  const [location, setLocation] = useState('')
  const [activity, setActivity] = useState('')
  const [caption, setCaption] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPhotoDetail, setShowPhotoDetail] = useState<Photo | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/')
      return
    }
    setUser(JSON.parse(storedUser))
    loadPhotos()
  }, [router])

  const loadPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select(`
        *,
        users:user_id (name)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      const photosWithNames = data.map((p: any) => ({
        ...p,
        user_name: p.users?.name || '未知用户'
      }))
      setPhotos(photosWithNames)
    }
  }

  const loadComments = async (photoId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (name)
      `)
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true })

    if (data) {
      const commentsWithNames = data.map((c: any) => ({
        ...c,
        user_name: c.users?.name || '未知用户'
      }))
      setComments(commentsWithNames)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedPhoto(e.target?.result as string)
        setShowUploadModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const compressImage = (file: File, quality: number = 0.6): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        let width = img.width
        let height = img.height
        const maxSize = 1000

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
            } else {
              reject(new Error('Compression failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleUpload = async () => {
    if (!selectedPhoto || !user) return

    setIsUploading(true)
    try {
      const fileInput = fileInputRef.current
      if (!fileInput?.files?.[0]) return

      let file = fileInput.files[0]
      
      if (file.size > 1 * 1024 * 1024) {
        let quality = 0.6
        if (file.size > 10 * 1024 * 1024) quality = 0.3
        else if (file.size > 5 * 1024 * 1024) quality = 0.4
        else if (file.size > 3 * 1024 * 1024) quality = 0.5
        
        file = await compressImage(file, quality)
      }

      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        alert('上传失败，请重试')
        return
      }

      const { url } = await uploadRes.json()

      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          image_url: url,
          caption: caption,
          photo_date: photoDate,
          location: location,
          activity: activity,
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        alert('保存失败，请重试')
        return
      }

      setShowUploadModal(false)
      setSelectedPhoto(null)
      setCaption('')
      setPhotoDate('')
      setLocation('')
      setActivity('')
      loadPhotos()
    } catch (err) {
      console.error('Error:', err)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !showPhotoDetail || !user) return

    const { error } = await supabase
      .from('comments')
      .insert({
        photo_id: showPhotoDetail.id,
        user_id: user.id,
        content: newComment.trim(),
      })

    if (!error) {
      setNewComment('')
      loadComments(showPhotoDetail.id)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!user || !confirm('确定要删除这张照片吗？删除后无法恢复。')) return

    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userId: user.id }),
      })

      if (res.ok) {
        setShowPhotoDetail(null)
        setComments([])
        loadPhotos()
      } else {
        const data = await res.json()
        alert(data.error || '删除失败')
      }
    } catch {
      alert('删除失败，请重试')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !confirm('确定要删除这条评论吗？')) return

    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId: user.id }),
      })

      if (res.ok && showPhotoDetail) {
        loadComments(showPhotoDetail.id)
      } else {
        const data = await res.json()
        alert(data.error || '删除失败')
      }
    } catch {
      alert('删除失败，请重试')
    }
  }

  const openPhotoDetail = (photo: Photo) => {
    setShowPhotoDetail(photo)
    loadComments(photo.id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Camera className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-[17px] font-semibold text-gray-900 tracking-tight">相册</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">上传照片</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/5 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">学号: {user.student_id}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">全部照片</h1>
          <p className="text-gray-500 text-sm mt-1">{photos.length} 张照片</p>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
              <ImageIcon className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有照片</h3>
            <p className="text-gray-500 mb-6">上传你的第一张照片，开始记录美好瞬间</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium shadow-md shadow-purple-500/20"
            >
              <Upload className="w-4 h-4" />
              上传照片
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => openPhotoDetail(photo)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || '照片'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-white text-xs font-medium">{photo.user_name}</span>
                        </div>
                        {user && photo.user_id === user.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePhoto(photo.id)
                            }}
                            className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {photo.caption && (
                    <p className="text-sm text-gray-700 font-medium line-clamp-1 mb-2">{photo.caption}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {photo.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{photo.location}</span>
                      </div>
                    )}
                    {photo.photo_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{photo.photo_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="text-lg font-semibold text-gray-900">上传照片</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedPhoto(null)
                  setCaption('')
                  setPhotoDate('')
                  setLocation('')
                  setActivity('')
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {selectedPhoto && (
                <div className="rounded-2xl overflow-hidden aspect-square bg-gray-100">
                  <img src={selectedPhoto} alt="预览" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">配文</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="写下这一刻的故事..."
                  className="w-full h-20 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 focus:bg-white transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    时间
                  </label>
                  <input
                    type="text"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    placeholder="如：2024年夏天"
                    className="w-full h-10 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    地点
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：北京故宫"
                    className="w-full h-10 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  在做什么
                </label>
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="如：和朋友一起爬山"
                  className="w-full h-10 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    上传照片
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal with Comments */}
      {showPhotoDetail && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          onClick={() => { setShowPhotoDetail(null); setComments([]); }}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px] md:min-h-0">
              <img
                src={showPhotoDetail.image_url}
                alt={showPhotoDetail.caption || '照片'}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            
            {/* Info & Comments Panel */}
            <div className="w-full md:w-96 bg-white rounded-2xl flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {showPhotoDetail.user_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{showPhotoDetail.user_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(showPhotoDetail.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && showPhotoDetail.user_id === user.id && (
                      <button
                        onClick={() => handleDeletePhoto(showPhotoDetail.id)}
                        className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                    <button
                      onClick={() => { setShowPhotoDetail(null); setComments([]); }}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                {(showPhotoDetail.caption || showPhotoDetail.location || showPhotoDetail.photo_date || showPhotoDetail.activity) && (
                  <div className="space-y-2.5">
                    {showPhotoDetail.caption && (
                      <p className="text-sm text-gray-700">{showPhotoDetail.caption}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {showPhotoDetail.photo_date && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                          <Calendar className="w-3 h-3" />
                          {showPhotoDetail.photo_date}
                        </div>
                      )}
                      {showPhotoDetail.location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                          <MapPin className="w-3 h-3" />
                          {showPhotoDetail.location}
                        </div>
                      )}
                      {showPhotoDetail.activity && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                          <Activity className="w-3 h-3" />
                          {showPhotoDetail.activity}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[200px]">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  评论 ({comments.length})
                </h4>
                
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">还没有评论，来说点什么吧</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group/comment">
                        <div className="w-7 h-7 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-medium">
                            {comment.user_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-700">{comment.user_name}</span>
                            <span className="text-[10px] text-gray-400">{formatTime(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{comment.content}</p>
                        </div>
                        {user && comment.user_id === user.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/comment:opacity-100 hover:bg-red-50 transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论..."
                    className="flex-1 h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 focus:bg-white transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all shadow-md shadow-purple-500/20"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
