import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

// Define your configuration
export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
}

// In NextAuth v5/beta (standard for Next.js 15+), use this:
const { handlers } = NextAuth(authOptions)
export const { GET, POST } = handlers

/* 
   If you are strictly on NextAuth v4, use this instead:
   const handler = NextAuth(authOptions)
   export { handler as GET, handler as POST }
*/