import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, Antonio } from "next/font/google";
import { NextAuthProvider } from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const antonio = Antonio({ 
  subsets: ["latin"], 
  weight: ["400"],
  variable: '--font-antonio' 
});

export const metadata: Metadata = {
  title: "Save the Date - Modern Digital Invitations",
  description: "Create beautiful digital invitations and manage RSVPs for your events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable, antonio.variable)}>
        <NextAuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
          <Toaster />
        </NextAuthProvider>
      </body>
    </html>
  );
}
