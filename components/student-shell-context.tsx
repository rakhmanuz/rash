'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type StudentShellEnrollment = {
  groupId: string
  groupName: string
  subjectName: string | null
}

export type StudentShellRegistration = {
  enrollments: StudentShellEnrollment[]
  dashboardNav: 'overview' | string
  setDashboardNav: (n: 'overview' | string) => void
  perGroupStats: Record<string, Record<string, unknown>>
}

type Ctx = {
  registration: StudentShellRegistration | null
  register: (r: StudentShellRegistration | null) => void
}

const StudentShellContext = createContext<Ctx | null>(null)

export function StudentShellProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<StudentShellRegistration | null>(null)
  const register = useCallback((r: StudentShellRegistration | null) => {
    setRegistration(r)
  }, [])
  const value = useMemo(() => ({ registration, register }), [registration, register])
  return <StudentShellContext.Provider value={value}>{children}</StudentShellContext.Provider>
}

export function useStudentShellRegistration(): StudentShellRegistration | null {
  return useContext(StudentShellContext)?.registration ?? null
}

export function useStudentShellRegister(): ((r: StudentShellRegistration | null) => void) | null {
  return useContext(StudentShellContext)?.register ?? null
}
