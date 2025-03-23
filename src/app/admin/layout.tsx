"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Home, LogOut, Menu, Settings, Users, X, CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="border-b bg-background h-16 fixed top-0 right-0 left-0 z-10">
        <div className="h-full container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg font-antonio">
                <b>S<i>a</i>ve the D<i>a</i>te</b>
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="hidden md:flex"
            >
              <Link href="/admin/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
            >
              <Link href="/">
                <LogOut className="h-4 w-4 mr-2" />
                Exit Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <div 
          className={cn(
            "fixed top-0 left-0 h-full w-[250px] bg-background border-r p-6 shadow-lg transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">Admin</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-1">
            <NavItem href="/admin" icon={<Home className="h-4 w-4" />} isMobile>
              Dashboard
            </NavItem>
            <NavItem href="/admin/guests" icon={<Users className="h-4 w-4" />} isMobile>
              Guests
            </NavItem>
            <NavItem href="/admin/invitations" icon={<BookOpen className="h-4 w-4" />} isMobile>
              Invitations
            </NavItem>
            <NavItem href="/admin/settings" icon={<Settings className="h-4 w-4" />} isMobile>
              Settings
            </NavItem>
          </nav>
        </div>
      </div>

      <div className="flex mt-16 min-h-[calc(100vh-64px)]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-[250px] border-r p-6 shrink-0 h-[calc(100vh-64px)] sticky top-16">
          <nav className="space-y-1">
            <NavItem href="/admin" icon={<Home className="h-4 w-4" />}>
              Dashboard
            </NavItem>
            <NavItem href="/admin/guests" icon={<Users className="h-4 w-4" />}>
              Guests
            </NavItem>
            <NavItem href="/admin/invitations" icon={<BookOpen className="h-4 w-4" />}>
              Invitations
            </NavItem>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isMobile?: boolean;
}

function NavItem({ href, icon, children, isMobile }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
        "hover:bg-muted transition-colors",
        isMobile ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="text-muted-foreground group-hover:text-foreground">
        {icon}
      </span>
      {children}
    </Link>
  );
} 