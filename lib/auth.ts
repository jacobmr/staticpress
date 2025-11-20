import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

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
    async signIn({ user, account }) {
      try {
        // Dynamically import database functions to prevent build-time initialization
        const { getOrCreateUser, logEvent } = await import('./db')

        // Create or update user in database using GitHub numeric ID
        if (account?.providerAccountId && user.email) {
          const dbUser = await getOrCreateUser({
            id: account.providerAccountId, // Use GitHub's numeric ID, not NextAuth's UUID
            email: user.email,
            name: user.name,
            image: user.image,
          })

          // Log OAuth completion event
          await logEvent('oauth_completed', dbUser.id, {
            provider: 'github',
            user_email: user.email,
          })
        }
        return true
      } catch (error) {
        console.error('Error creating user in database:', error)
        return true // Still allow sign in even if database fails
      }
    },
    async jwt({ token, account, user, trigger }) {
      // On sign in, set the access token and GitHub ID
      if (account) {
        console.log('[Auth JWT] Account data:', {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          hasAccessToken: !!account.access_token
        })
        token.accessToken = account.access_token
        token.githubId = account.providerAccountId // Store GitHub numeric ID
      }

      console.log('[Auth JWT] Token:', {
        hasAccessToken: !!token.accessToken,
        githubId: token.githubId,
        sub: token.sub
      })

      return token
    },
    async session({ session, token }) {
      console.log('[Auth Session] Token data:', {
        hasAccessToken: !!token.accessToken,
        githubId: token.githubId
      })

      if (!token) {
        return session
      }

      // If we have a token but no githubId, this is an old session from before we fixed auth
      // We should not populate the session - this will cause it to fail and force re-login
      if (!token.githubId) {
        console.warn('[Auth Session] Old session detected - missing githubId, forcing re-authentication')
        // Return session without user data to force sign out
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).user = undefined
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).accessToken = undefined
        return session
      }

      session.accessToken = token.accessToken as string
      session.user.id = token.githubId as string // Use GitHub numeric ID

      console.log('[Auth Session] Final session:', {
        hasUser: !!session.user,
        userId: session.user.id,
        hasAccessToken: !!session.accessToken
      })

      return session
    },
  },
  pages: {
    signIn: '/',
  },
})
