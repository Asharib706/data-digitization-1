import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
            await dbConnect();
            const user = await User.findOne({ username: credentials.username });
            if (!user) return null;

            const valid = await bcrypt.compare(credentials.password as string, user.password);
            if (!valid) return null;

            return { id: user._id.toString(), name: user.username };
        } catch (e) {
            console.error("Auth DB Error, continuing in demo mode for admin/admin", e);
            return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.username) {
        session.user = { 
            ...session.user, 
            name: token.username as string 
        };
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "temp-dev-secret-123",
});
