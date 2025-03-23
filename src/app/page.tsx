import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle, Send } from "lucide-react";
import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
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
          <Button asChild>
            <Link href="/create-event">Create Event</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 py-10 md:py-24">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          <h1 className="text-3xl md:text-6xl font-bold tracking-tight">
            Create Beautiful 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 ml-2">
              Digital Invitations
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern RSVP platform for events. Create stunning invitations, QR codes, and track responses - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mt-6 md:mt-8">
            <Button asChild size="lg" className="rounded-full px-4 md:px-6 text-sm md:text-base w-[220px] mx-auto sm:mx-0">
              <Link href="/create-event">
                Create Your Event
                <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-4 md:px-6 text-sm md:text-base w-[220px] mx-auto sm:mx-0">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-12 md:py-20">
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Why choose us?</h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-10">
            <FeatureCard 
              icon={<Calendar className="h-10 w-10 text-primary" />}
              title="Effortless Event Creation"
              description="Set up your event in minutes. Customize every detail and get a unique event link instantly."
            />
            <FeatureCard 
              icon={<Send className="h-10 w-10 text-primary" />}
              title="Digital Invitations"
              description="Generate beautiful QR codes and digital save-the-date cards to share via email, text, or social media."
            />
            <FeatureCard 
              icon={<CheckCircle className="h-10 w-10 text-primary" />}
              title="One-Click RSVP"
              description="Guests can RSVP instantly without signing up. Track responses in real-time on your dashboard."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-20">
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <Step number={1} title="Create Your Event" description="Enter your event details including name, date, location, and customize the look and feel." />
            <Step number={2} title="Invite Your Guests" description="Add guests manually or upload a list. Each guest receives a personalized invitation link." />
            <Step number={3} title="Track RSVPs" description="Monitor responses in real-time and send reminders to guests who haven't responded yet." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-10 md:py-16">
        <div className="px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Ready to Create Your Event?</h2>
          <p className="text-base md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of hosts who have simplified their event planning with <span className="font-antonio"><b>S<i>a</i>ve the D<i>a</i>te</b></span>.
          </p>
          <Button 
            asChild 
            size="lg" 
            variant="secondary" 
            className="rounded-full px-4 md:px-6 text-sm md:text-base w-[220px] mx-auto"
          >
            <Link href="/create-event">Get Started for Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8 md:py-10">
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5 md:gap-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <span className="font-medium text-sm md:text-base font-antonio">
                <b>S<i>a</i>ve the D<i>a</i>te</b>
              </span>
            </div>
            <div className="flex gap-6 md:gap-8">
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
              <Link href="/mock-testing" className="text-xs md:text-sm text-muted-foreground hover:text-foreground">
                Test Mode
              </Link>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              © {new Date().getFullYear()} SaveTheDate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-background p-4 md:p-6 rounded-xl shadow-sm border border-border flex flex-col items-center text-center">
      <div className="mb-3 md:mb-4 h-8 w-8 md:h-10 md:w-10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2">{title}</h3>
      <p className="text-sm md:text-base text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg md:text-xl font-bold mb-3 md:mb-4">
        {number}
      </div>
      <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2">{title}</h3>
      <p className="text-sm md:text-base text-muted-foreground">{description}</p>
    </div>
  );
}
