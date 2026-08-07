import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.string().optional(),
})

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { email, password, rememberMe } = await loginSchema.parseAsync(credentials)

          const { prisma } = await import("@/lib/prisma")

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          })

          if (!user || !user.password) {
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)

          if (!isValid) {
            return null
          }

          if (!user.isActive || user.deletedAt) {
            throw new Error("Account is deactivated")
          }

          let displayName = user.email

          if (user.role === "individual") {
            const profile = await prisma.individualProfile.findUnique({
              where: { userId: user.id },
              select: { name: true },
            })
            displayName = profile?.name || user.email
          } else if (user.role === "restaurant") {
            const profile = await prisma.restaurantProfile.findUnique({
              where: { userId: user.id },
              select: { restaurantName: true },
            })
            displayName = profile?.restaurantName || user.email
          } else if (user.role === "ngo") {
            const profile = await prisma.ngoProfile.findUnique({
              where: { userId: user.id },
              select: { ngoName: true },
            })
            displayName = profile?.ngoName || user.email
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            name: displayName,
            role: user.role,
            rememberMe: rememberMe === "true",
          }
        } catch (error) {
          if (error instanceof Error && error.message === "Account is deactivated") {
            throw error;
          }
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const { prisma } = await import("@/lib/prisma")

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (!existingUser) {
          // Create new user for Google sign-in
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              emailVerifiedAt: new Date(),
              role: "individual",
            },
          })

          // Create individual profile
          await prisma.individualProfile.create({
            data: {
              userId: newUser.id,
              name: user.name || user.email!.split("@")[0],
              acceptedDisclaimer: false,
            },
          })

          user.id = newUser.id
          user.role = "individual"
        } else {
          user.id = existingUser.id
          user.role = existingUser.role

          // Update last login
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() },
          })
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        
        // If it's a credentials login, `user` contains our custom rememberMe flag
        // If it's Google login, default to rememberMe = true since they don't have a checkbox
        const isRemembered = 'rememberMe' in user ? user.rememberMe : true;
        token.isRemembered = isRemembered;
        
        // 15 days in seconds if remembered, 1 day (24 hours) if not
        const maxAgeSeconds = isRemembered ? (15 * 24 * 60 * 60) : (24 * 60 * 60);
        token.exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtected = nextUrl.pathname.startsWith("/protected");

      if (isOnProtected) {
        if (isLoggedIn) return true;
        return false; // Automatically redirects unauthenticated users to signIn page
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 24 * 60 * 60, // Default 15 days, overridden dynamically in jwt callback
  },
  secret: process.env.AUTH_SECRET,
}