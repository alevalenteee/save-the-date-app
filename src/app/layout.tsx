import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, Antonio } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const antonio = Antonio({ subsets: ["latin"], variable: "--font-antonio" });

export const metadata: Metadata = {
  title: "S̶a̶ve the D̶a̶te - Modern Event Invitations",
  description: "Create beautiful digital invitations for your events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable, antonio.variable)}>
        <div className="mx-auto max-w-screen-xl">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
