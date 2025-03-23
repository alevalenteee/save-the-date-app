import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, Antonio } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const antonio = Antonio({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-antonio',
});

export const metadata: Metadata = {
  title: "S\u0332a\u0332ve the D\u0332a\u0332te | Create Digital Invitations",
  description: "Create beautiful digital invitations for your events and celebrations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable, antonio.variable)}>
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
