'use client'

import { useEffect } from 'react'
import { isTelegramWebApp, useTelegramWebApp } from '@/lib/telegram'

export function TelegramWebApp() {
  const tg = useTelegramWebApp()

  useEffect(() => {
    if (isTelegramWebApp() && tg) {
      // Telegram Web App'ni tayyorlash
      tg.ready()
      
      // Expand qilish (to'liq ekran)
      tg.expand()
      
      // Theme'ni sozlash
      if (tg.themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color)
      }
      if (tg.themeParams.text_color) {
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color)
      }
      if (tg.themeParams.button_color) {
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color)
      }
      if (tg.themeParams.button_text_color) {
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color)
      }

      // Back button handler
      tg.BackButton.onClick(() => {
        if (window.history.length > 1) {
          window.history.back()
        } else {
          tg.close()
        }
      })

      // Viewport o'zgarishlarini kuzatish
      const handleViewportChange = () => {
        // Viewport o'zgarganda qayta expand qilish
        tg.expand()
      }

      tg.onEvent('viewportChanged', handleViewportChange)

      return () => {
        tg.offEvent('viewportChanged', handleViewportChange)
      }
    }
  }, [tg])

  return null
}
