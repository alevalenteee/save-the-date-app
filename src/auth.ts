import NextAuth from "next-auth";
// Remove FirebaseAdapter import temporarily
// import { FirebaseAdapter } from "@auth/firebase-adapter";
// import { cert } from "firebase-admin/app";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth as clientAuth } from "./lib/firebase";
import { db } from "./lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      }
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
          const userCredential = await signInWithEmailAndPassword(
            clientAuth,
            credentials.email,
            credentials.password
          );
          
          const user = userCredential.user;
          if (!user) return null;

          return {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
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
    async signIn({ user, account }) {
      console.log("SIGN IN CALLBACK TRIGGERED", { userId: user.id, email: user.email, provider: account?.provider });
      
      if (!user.email) {
        console.error("User email is missing in signIn callback");
        return false; // Don't allow sign in without email
      }
      
      try {
        // First check if a user with this email already exists
        const usersRef = collection(db, 'users');
        const emailQuery = query(usersRef, where("email", "==", user.email));
        const existingUsers = await getDocs(emailQuery);
        
        let userId = user.id;
        
        // If we found an existing user with this email
        if (!existingUsers.empty) {
          const existingUser = existingUsers.docs[0];
          userId = existingUser.id; // Use the existing user ID
          
          console.log("Found existing user with this email:", userId);
          
          // Update the JWT token to use this existing userId
          user.id = userId;
        }
        
        // Now check or create user document with the correct ID
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log("Creating user in Firestore:", userId);
          
          await setDoc(userRef, {
            name: user.name || 'User',
            email: user.email,
            image: user.image || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          console.log("User created successfully in Firestore");
        } else {
          // Update the user's last login time
          await setDoc(userRef, {
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return true; // Still allow sign in even if Firestore fails
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // For both providers, we use the consistent user ID
        token.sub = user.id;
      }
      return token;
    }
  }
}); 