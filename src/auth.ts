import NextAuth from "next-auth";
// Remove FirebaseAdapter import temporarily
// import { FirebaseAdapter } from "@auth/firebase-adapter";
// import { cert } from "firebase-admin/app";
// import { adminDB } from "./lib/firebase-admin";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth as clientAuth } from "./lib/firebase";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Using Firebase Auth to handle sign-in
          const userCredential = await signInWithEmailAndPassword(
            clientAuth,
            credentials.email,
            credentials.password
          );
          
          const user = userCredential.user;
          if (!user) return null;

          return {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            image: user.photoURL
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  // Remove Firebase adapter temporarily to fix the dependency issue
  // adapter: FirebaseAdapter(adminDB),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  }
}); 