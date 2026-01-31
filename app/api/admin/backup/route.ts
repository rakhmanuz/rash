import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

// Database backup yaratish
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Database fayl yo'lini aniqlash
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const backupDir = path.join(process.cwd(), 'backups')
    
    // Backup papkasini yaratish
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Backup fayl nomi
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')
    const backupFileName = `rash_db_backup_${timestamp}.db`
    const backupPath = path.join(backupDir, backupFileName)

    // Database'ni nusxalash
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
      
      // Eski backup'larni o'chirish (30 kundan eski)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      const files = fs.readdirSync(backupDir)
      files.forEach(file => {
        if (file.startsWith('rash_db_backup_') && file.endsWith('.db')) {
          const filePath = path.join(backupDir, file)
          const stats = fs.statSync(filePath)
          if (stats.mtimeMs < thirtyDaysAgo) {
            fs.unlinkSync(filePath)
          }
        }
      })

      // Backup'lar ro'yxatini olish
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('rash_db_backup_') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(backupDir, file)
          const stats = fs.statSync(filePath)
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return NextResponse.json({
        success: true,
        message: 'Backup muvaffaqiyatli yaratildi',
        backupFile: backupFileName,
        backups: backupFiles,
      })
    } else {
      return NextResponse.json(
        { error: 'Database fayli topilmadi' },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

// Backup'lar ro'yxatini olish
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [] })
    }

    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('rash_db_backup_') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ backups: backupFiles })
  } catch (error: any) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
