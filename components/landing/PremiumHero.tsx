'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// 3D Geometrik jismlar - faqat oq wireframe
function Cube3D({ position, rotation }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        color="#ffffff"
        wireframe
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

// Tetrahedron (3D)
function Tetrahedron3D({ position, rotation }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <tetrahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial 
        color="#ffffff"
        wireframe
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

// Octahedron (3D)
function Octahedron3D({ position, rotation }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3
      meshRef.current.rotation.y += delta * 0.4
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <octahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial 
        color="#ffffff"
        wireframe
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

// Icosahedron (3D)
function Icosahedron3D({ position, rotation }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <icosahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial 
        color="#ffffff"
        wireframe
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

// 4D Hypercube (Tesseract) - 3D ga proyeksiya
function Tesseract4D({ position, rotation }: any) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  useFrame((state, delta) => {
    timeRef.current += delta
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.1
      groupRef.current.rotation.y += delta * 0.15
      groupRef.current.rotation.z += delta * 0.1
    }
  })

  const size = 0.6

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Inner cube */}
      <mesh>
        <boxGeometry args={[size * 0.6, size * 0.6, size * 0.6]} />
        <meshBasicMaterial 
          color="#ffffff"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Outer cube */}
      <mesh>
        <boxGeometry args={[size * 1.2, size * 1.2, size * 1.2]} />
        <meshBasicMaterial 
          color="#ffffff"
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Connecting edges - 4D tesseract structure */}
      {[
        // Inner to outer connections
        [[-size*0.3, -size*0.3, -size*0.3], [-size*0.6, -size*0.6, -size*0.6]],
        [[size*0.3, -size*0.3, -size*0.3], [size*0.6, -size*0.6, -size*0.6]],
        [[size*0.3, size*0.3, -size*0.3], [size*0.6, size*0.6, -size*0.6]],
        [[-size*0.3, size*0.3, -size*0.3], [-size*0.6, size*0.6, -size*0.6]],
        [[-size*0.3, -size*0.3, size*0.3], [-size*0.6, -size*0.6, size*0.6]],
        [[size*0.3, -size*0.3, size*0.3], [size*0.6, -size*0.6, size*0.6]],
        [[size*0.3, size*0.3, size*0.3], [size*0.6, size*0.6, size*0.6]],
        [[-size*0.3, size*0.3, size*0.3], [-size*0.6, size*0.6, size*0.6]],
      ].map(([start, end], i) => {
        const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3 })
        const line = new THREE.Line(geometry, material)
        return (
          <primitive key={i} object={line} />
        )
      })}
    </group>
  )
}

// 5D Hypercube (Penteract) - 3D ga proyeksiya
function Penteract5D({ position, rotation }: any) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.08
      groupRef.current.rotation.y += delta * 0.12
      groupRef.current.rotation.z += delta * 0.08
    }
  })

  const size = 0.5

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Multiple nested cubes representing 5D structure */}
      {[0.3, 0.5, 0.7, 0.9].map((scale, i) => (
        <mesh key={i}>
          <boxGeometry args={[size * scale, size * scale, size * scale]} />
          <meshBasicMaterial 
            color="#ffffff"
            wireframe
            transparent
            opacity={0.3 - i * 0.05}
          />
        </mesh>
      ))}
    </group>
  )
}

// 3D Sharsimon shakl (Geometric Sphere) - real vaqtda ishlaydi, mashnaqa ko'rinish
function GeometricSphere({ position, rotation }: any) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)
  // Katta uchburchaklar uchun kam subdivision
  const outerGeo = useRef(new THREE.IcosahedronGeometry(1.2, 1))

  useFrame((state, delta) => {
    timeRef.current += delta
    if (groupRef.current) {
      // Aylanish
      groupRef.current.rotation.x += delta * 0.4
      groupRef.current.rotation.y += delta * 0.5
      groupRef.current.rotation.z += delta * 0.3
      
      // Yengil tebranish
      groupRef.current.position.y = position[1] + Math.sin(timeRef.current * 2) * 0.2
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Qirralar bo'ylab orqa fon ko'rinishi uchun wireframe - kattaroq va ko'rinadigan */}
      <mesh geometry={outerGeo.current}>
        <meshBasicMaterial 
          color="#22c55e"
          wireframe
          transparent
          opacity={1}
        />
      </mesh>
      {/* Tashqi sharsimon shakl - shaffof, qirralar bo'ylab bo'sh qolishi uchun */}
      <mesh geometry={outerGeo.current}>
        <meshStandardMaterial 
          color="#6ee7b7"
          transparent
          opacity={0.3}
          metalness={0.5}
          roughness={0.1}
          flatShading={false}
        />
      </mesh>
    </group>
  )
}

// Scene komponenti
function Scene3D() {
  // Har xil 3D, 4D, 5D jismlarni yaratish - faqat oq rang
  const shapeTypes = [
    { type: 'cube' },
    { type: 'tetrahedron' },
    { type: 'octahedron' },
    { type: 'icosahedron' },
    { type: 'tesseract' },
    { type: 'penteract' },
  ]

  const shapes = Array.from({ length: 25 }, (_, i) => {
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]
    return {
      id: i,
      type: type.type,
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ] as [number, number, number],
    }
  })

  return (
    <>
      <ambientLight intensity={1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#22c55e" />
      
      {shapes.map((shape) => {
        const key = `shape-${shape.id}`
        switch (shape.type) {
          case 'cube':
            return <Cube3D key={key} position={shape.position} rotation={shape.rotation} />
          case 'tetrahedron':
            return <Tetrahedron3D key={key} position={shape.position} rotation={shape.rotation} />
          case 'octahedron':
            return <Octahedron3D key={key} position={shape.position} rotation={shape.rotation} />
          case 'icosahedron':
            return <Icosahedron3D key={key} position={shape.position} rotation={shape.rotation} />
          case 'tesseract':
            return <Tesseract4D key={key} position={shape.position} rotation={shape.rotation} />
          case 'penteract':
            return <Penteract5D key={key} position={shape.position} rotation={shape.rotation} />
          default:
            return null
        }
      })}
    </>
  )
}

export function PremiumHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-visible">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas
          camera={{ position: [0, 0, 15], fov: 75 }}
          gl={{ alpha: false, antialias: true }}
          style={{ background: 'linear-gradient(to bottom, #334155, #475569, #334155)' }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 15]} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
          <Scene3D />
        </Canvas>
      </div>


      {/* Content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-20 w-full max-w-full overflow-x-hidden" style={{ overflow: 'visible' }}>
        <div className="text-center max-w-6xl mx-auto w-full px-2 sm:px-0">
          {/* Badge */}
          <div 
            className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full mb-6 sm:mb-8 lg:mb-12 animate-fade-in"
            style={{
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
            }}
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
              Education Automation Platform
            </span>
          </div>

          {/* Main Logo with Sphere */}
          <div className="mb-6 sm:mb-8 lg:mb-12 relative flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4" style={{ overflow: 'visible' }}>
            {/* Sharsimon shakl - rash.uz dan oldin */}
            <div className="relative w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72" style={{ zIndex: 1 }}>
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                gl={{ alpha: true, antialias: true }}
                style={{ background: 'transparent' }}
              >
                <ambientLight intensity={1.2} />
                <directionalLight 
                  position={[5, 5, 5]} 
                  intensity={1.5} 
                  color="#6ee7b7"
                />
                <pointLight position={[3, 3, 3]} intensity={1.2} color="#86efac" />
                <pointLight position={[-3, -3, -3]} intensity={0.8} color="#a7f3d0" />
                <GeometricSphere 
                  position={[0, 0, 0]} 
                  rotation={[0, 0, 0]} 
                />
              </Canvas>
            </div>

            {/* rash.uz Logo */}
            <div className="relative" style={{ overflow: 'visible', zIndex: 2 }}>
              
              {/* Dotted structure around logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="relative"
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    height: '100%',
                    maxHeight: '500px',
                    aspectRatio: '1',
                    backgroundImage: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                    animation: 'rotate 20s linear infinite',
                  }}
                />
              </div>

                  <h1
                    className="relative text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-tight sm:leading-none mb-2 sm:mb-4"
                    style={{
                      letterSpacing: '-0.01em',
                      textShadow: '0 0 40px rgba(34, 197, 94, 0.4), 0 0 80px rgba(34, 197, 94, 0.2)',
                      transform: 'translateZ(0)',
                      willChange: 'transform',
                      overflow: 'visible',
                    }}
                  >
                    <span
                      className="block bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-transparent bg-clip-text break-words"
                      style={{
                        filter: 'drop-shadow(0 0 30px rgba(34, 197, 94, 0.6)) drop-shadow(0 0 60px rgba(34, 197, 94, 0.3))',
                        animation: 'glow 3s ease-in-out infinite alternate',
                        textShadow: '0 0 40px rgba(34, 197, 94, 0.4), 0 0 80px rgba(34, 197, 94, 0.2)',
                      }}
                    >
                      rash.uz
                    </span>
                  </h1>
            </div>
          </div>

              {/* Subtitle */}
              <p
                className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl text-white mb-3 sm:mb-4 lg:mb-6 font-semibold tracking-wide px-2 sm:px-0"
                style={{
                  letterSpacing: '0.05em',
                  textShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.1)',
                  fontWeight: 600,
                }}
              >
                Professional o'quv markazi boshqaruv platformasi
              </p>
              <p
                className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-100 mb-8 sm:mb-12 lg:mb-16 max-w-3xl mx-auto font-medium px-2 sm:px-0"
                style={{
                  letterSpacing: '0.03em',
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 255, 255, 0.08)',
                  fontWeight: 500,
                }}
              >
                To'liq avtomatlashtirilgan raqamli ekotizim. Barcha jarayonlar bitta kuchli tizimda.
              </p>

              {/* CTA Button */}
              <div className="relative px-2 sm:px-0">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg sm:rounded-xl transition-all duration-300 relative overflow-hidden w-full sm:w-auto max-w-xs sm:max-w-none"
                  style={{
                    boxShadow: '0 10px 40px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.2)',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) translateZ(0)'
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateZ(0)'
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{
                      transform: 'translateX(-100%)',
                      animation: 'shine 3s infinite',
                    }}
                  />

                  <span className="relative z-10 text-sm sm:text-base lg:text-lg">Tizimga kirish</span>
                  <ArrowRight
                    className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ transform: 'translateZ(0)' }}
                  />
                </Link>
              </div>
        </div>
      </div>

      {/* Additional CSS animations */}
      <style jsx>{`
        @keyframes glow {
          from {
            filter: drop-shadow(0 0 30px rgba(34, 197, 94, 0.5));
          }
          to {
            filter: drop-shadow(0 0 50px rgba(34, 197, 94, 0.8));
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateZ(0);
          }
          100% {
            transform: translateX(200%) translateZ(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </section>
  )
}
