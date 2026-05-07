import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
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
      },
      async authorize(credentials) {
        try {
          const { email, password } = await loginSchema.parseAsync(credentials)
          
          const { prisma } = await import("@/lib/prisma")
          
          // Find user without loading all profiles
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

          // Check if user is active
          if (!user.isActive || user.deletedAt) {
            throw new Error("Account is deactivated")
          }

          // Get display name from appropriate profile
          let displayName = user.email
          
          if (user.role === 'individual') {
            const profile = await prisma.individualProfile.findUnique({
              where: { userId: user.id },
              select: { name: true }
            })
            displayName = profile?.name || user.email
          } else if (user.role === 'restaurant') {
            const profile = await prisma.restaurantProfile.findUnique({
              where: { userId: user.id },
              select: { restaurantName: true }
            })
            displayName = profile?.restaurantName || user.email
          } else if (user.role === 'ngo') {
            const profile = await prisma.ngoProfile.findUnique({
              where: { userId: user.id },
              select: { ngoName: true }
            })
            displayName = profile?.ngoName || user.email
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: displayName,
            role: user.role,
          }
        } catch (error) {
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
          where: { email: user.email! }
        })
        
        if (!existingUser) {
          // Create new user for Google sign-in
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              emailVerified: new Date(),
              role: 'individual',
            }
          })
          
          // Create individual profile
          await prisma.individualProfile.create({
            data: {
              userId: newUser.id,
              name: user.name || user.email!.split('@')[0],
              acceptedDisclaimer: false,
            }
          })
          
          user.id = newUser.id
          user.role = 'individual'
        } else {
          user.id = existingUser.id
          user.role = existingUser.role
          
          // Update last login
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() }
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
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
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
}