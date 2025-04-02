"use client";

import { CheckCircle, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string;
  venue?: string;
}

export default function ThankYouPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/public`);
        
        if (!res.ok) {
          router.push("/");
          return;
        }
        
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error("Error fetching event:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-lg font-medium">Loading...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-6 px-4">
          <Link href="/" className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl font-antonio">
              <b>S<i>a</i>ve the D<i>a</i>te</b>
            </span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold">Thank You!</h1>
          
          <p className="text-lg">
            Your RSVP for {event?.name || "the event"} has been received.
          </p>
          
          <p className="text-muted-foreground">
            We've sent a confirmation to your email address.
          </p>
          
          <div className="pt-6 space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/rsvp/${eventId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Event
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SaveTheDate. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 