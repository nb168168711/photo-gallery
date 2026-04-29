'use client'

import { useState, useEffect, useRef } from 'react'

interface EyeProps {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
}

const Eye = ({
  size = 40,
  pupilSize = 14,
  maxDistance = 8,
  eyeColor = 'white',
  pupilColor = '#1d1d1f',
  isBlinking = false,
}: EyeProps) => {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const eyeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX)
      setMouseY(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 }

    const eye = eyeRef.current.getBoundingClientRect()
    const eyeCenterX = eye.left + eye.width / 2
    const eyeCenterY = eye.top + eye.height / 2

    const deltaX = mouseX - eyeCenterX
    const deltaY = mouseY - eyeCenterY
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)

    const angle = Math.atan2(deltaY, deltaX)
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    }
  }

  const pupilPosition = calculatePupilPosition()

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        transition: 'height 0.1s ease',
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}

export function AnimatedCharacters() {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX)
      setMouseY(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Blinking effect
  useEffect(() => {
    const scheduleBlink = () => {
      const timeout = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => {
          setIsBlinking(false)
          scheduleBlink()
        }, 150)
      }, Math.random() * 4000 + 3000)
      return timeout
    }
    const timeout = scheduleBlink()
    return () => clearTimeout(timeout)
  }, [])

  const calculateTransform = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { x: 0, y: 0, skew: 0 }

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 3

    const deltaX = mouseX - centerX
    const deltaY = mouseY - centerY

    return {
      x: Math.max(-15, Math.min(15, deltaX / 20)),
      y: Math.max(-10, Math.min(10, deltaY / 30)),
      skew: Math.max(-6, Math.min(6, -deltaX / 120)),
    }
  }

  const purplePos = calculateTransform(purpleRef)
  const blackPos = calculateTransform(blackRef)
  const orangePos = calculateTransform(orangeRef)
  const yellowPos = calculateTransform(yellowRef)

  return (
    <div className="relative" style={{ width: '550px', height: '400px' }}>
      {/* Purple tall rectangle - Back layer */}
      <div
        ref={purpleRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '70px',
          width: '180px',
          height: '400px',
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: `skewX(${purplePos.skew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: `${45 + purplePos.x}px`,
            top: `${40 + purplePos.y}px`,
          }}
        >
          <Eye size={18} pupilSize={7} maxDistance={5} isBlinking={isBlinking} />
          <Eye size={18} pupilSize={7} maxDistance={5} isBlinking={isBlinking} />
        </div>
      </div>

      {/* Black tall rectangle - Middle layer */}
      <div
        ref={blackRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '240px',
          width: '120px',
          height: '310px',
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: `skewX(${blackPos.skew * 1.5}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: `${26 + blackPos.x}px`,
            top: `${32 + blackPos.y}px`,
          }}
        >
          <Eye size={16} pupilSize={6} maxDistance={4} isBlinking={isBlinking} />
          <Eye size={16} pupilSize={6} maxDistance={4} isBlinking={isBlinking} />
        </div>
      </div>

      {/* Orange semi-circle - Front left */}
      <div
        ref={orangeRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '0px',
          width: '240px',
          height: '200px',
          zIndex: 3,
          backgroundColor: '#FF9B6B',
          borderRadius: '120px 120px 0 0',
          transform: `skewX(${orangePos.skew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: `${82 + orangePos.x}px`,
            top: `${90 + orangePos.y}px`,
          }}
        >
          <Eye size={12} pupilSize={5} maxDistance={5} eyeColor="white" isBlinking={isBlinking} />
          <Eye size={12} pupilSize={5} maxDistance={5} eyeColor="white" isBlinking={isBlinking} />
        </div>
      </div>

      {/* Yellow tall rectangle - Front right */}
      <div
        ref={yellowRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '310px',
          width: '140px',
          height: '230px',
          backgroundColor: '#E8D754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform: `skewX(${yellowPos.skew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: `${52 + yellowPos.x}px`,
            top: `${40 + yellowPos.y}px`,
          }}
        >
          <Eye size={12} pupilSize={5} maxDistance={5} eyeColor="white" isBlinking={isBlinking} />
          <Eye size={12} pupilSize={5} maxDistance={5} eyeColor="white" isBlinking={isBlinking} />
        </div>
        {/* Mouth */}
        <div
          className="absolute h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
          style={{
            width: '80px',
            left: `${40 + yellowPos.x}px`,
            top: `${88 + yellowPos.y}px`,
          }}
        />
      </div>
    </div>
  )
}
