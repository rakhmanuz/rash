import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      username?: string
      name?: string | null
      image?: string | null
      role?: string
    }
  }

  interface User {
    id: string
    email?: string | null
    username?: string
    name?: string | null
    image?: string | null
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
  }
}
