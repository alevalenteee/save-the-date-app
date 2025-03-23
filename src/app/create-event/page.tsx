import EventCreationForm from "@/components/EventCreationForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function CreateEventPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="container mx-auto py-6 flex justify-between items-center">
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
      </header>

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