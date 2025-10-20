import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { getOrCreateUser } from "./db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Create or update user in database
        if (user.id && user.email) {
          await getOrCreateUser({
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          })
        }
        return true
      } catch (error) {
        console.error('Error creating user in database:', error)
        return true // Still allow sign in even if database fails
      }
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
      }
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = token.userId as string
      return session
    },
  },
  pages: {
    signIn: '/',
  },
})
