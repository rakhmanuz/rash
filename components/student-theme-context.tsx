'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type StudentVisualTheme = 'dark' | 'online-light'

const StudentThemeContext = createContext<StudentVisualTheme>('dark')

export function StudentThemeProvider({
  theme,
  children,
}: {
  theme: StudentVisualTheme
  children: ReactNode
}) {
  return <StudentThemeContext.Provider value={theme}>{children}</StudentThemeContext.Provider>
}

export function useStudentVisualTheme(): StudentVisualTheme {
  return useContext(StudentThemeContext)
}

export function isOnlineLightTheme(theme: StudentVisualTheme): boolean {
  return theme === 'online-light'
}
