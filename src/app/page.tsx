'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Camera, LogIn } from 'lucide-react'
import { AnimatedCharacters } from '@/components/animated-characters'

export default function LoginPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', studentId)
        .eq('name', name)
        .single()

      if (error || !data) {
        setError('学号或姓名错误，请重试')
        return
      }

      localStorage.setItem('user', JSON.stringify(data))
      router.push('/gallery')
    } catch (err) {
      setError('登录失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative" 
      style={{ 
        background: 'linear-gradient(135deg, #f5f0ff 0%, #ede5f8 40%, #e8dff5 100%)' 
      }}
    >
      {/* Soft decorative blobs */}
      <div className="absolute top-[5%] left-[10%] w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[5%] right-[5%] w-96 h-96 bg-indigo-200/25 rounded-full blur-3xl" />
      <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-pink-200/20 rounded-full blur-2xl" />

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center px-8 lg:px-20">
        
        {/* Left side - Animated Characters */}
        <div className="hidden lg:flex flex-1 items-center justify-center pr-12">
          <div className="transform scale-150">
            <AnimatedCharacters />
          </div>
        </div>

        {/* Right side - Login */}
        <div className="w-full lg:w-[480px] flex items-center justify-center">
          <div className="w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">相册</span>
            </div>

            {/* Login Card - Larger */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-2xl shadow-purple-100/40 border border-white/60">
              {/* Logo in card - desktop */}
              <div className="hidden lg:flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-800">相册</span>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  欢迎回来
                </h1>
                <p className="text-gray-400 text-base">
                  输入学号和姓名开始记录
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    学号
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="请输入学号"
                    className="w-full h-12 px-4 bg-white/70 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full h-12 px-4 bg-white/70 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 focus:bg-white transition-all"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25 text-base mt-3"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      登录
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-300">
                  仅限已注册用户访问
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
