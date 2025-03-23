"use client";

import EventCreationForm from "@/components/EventCreationForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CreateEventPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="container mx-auto py-6 px-4">
        {/* Desktop view */}
        <div className="hidden md:flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl font-antonio">
              <b>S<i>a</i>ve the D<i>a</i>te</b>
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/pricing" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </Link>
          </div>
        </div>

        {/* Mobile view */}
        <div className="flex md:hidden justify-between items-center">
          <div className="w-10">
            {/* Empty div for spacing */}
          </div>
          
          {/* Centered logo */}
          <Link href="/" className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl font-antonio">
              <b>S<i>a</i>ve the D<i>a</i>te</b>
            </span>
          </Link>
          
          {/* Burger menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex justify-center items-center"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div 
          className={cn(
            "fixed top-0 right-0 h-full w-[250px] bg-background border-l p-6 shadow-lg transition-transform duration-300",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="font-medium">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-4">
            <Link 
              href="/pricing" 
              className="block text-sm font-medium hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Button asChild className="w-full">
              <Link 
                href="/create-event"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </Button>
          </nav>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create Your Event</h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details below to create your event and start collecting RSVPs.
          </p>
          
          <EventCreationForm />
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SaveTheDate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 