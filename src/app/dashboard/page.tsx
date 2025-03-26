"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle, PlusCircle, Calendar, User, MessageSquare, ExternalLink, Trash, Edit, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string;
  hostName?: string;
  description?: string;
  imageUrl?: string;
  guestCount?: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }

    if (status === "authenticated") {
      fetchEvents();
    }
  }, [status, router]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load your events");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-lg font-medium">Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
              <Link href="/create-event">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Event
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div 
          className={cn(
            "fixed top-0 left-0 h-full w-[250px] bg-background border-r p-6 shadow-lg transition-transform duration-300",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">Menu</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-4">
            <Link 
              href="/create-event" 
              className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PlusCircle className="h-4 w-4" />
              Create New Event
            </Link>
            <Link 
              href="/auth/signout" 
              className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
              Sign Out
            </Link>
          </nav>
        </div>
      </div>

      <div className="flex mt-16 min-h-[calc(100vh-64px)]">
        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Your Events</h1>
              <p className="text-muted-foreground">
                {events.length > 0 
                  ? `Manage your ${events.length} event${events.length !== 1 ? 's' : ''}`
                  : "Create your first event to get started"
                }
              </p>
            </div>
            <Button asChild className="mt-4 md:mt-0">
              <Link href="/create-event">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Event
              </Link>
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {events.length === 0 && !error ? (
            <Card className="border-dashed border-2 bg-muted/50">
              <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Create your first event to start collecting RSVPs and managing your guest list.
                </p>
                <Button asChild>
                  <Link href="/create-event">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  {event.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={event.imageUrl} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                    <CardDescription>
                      {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-4 h-4 mt-0.5 mr-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                        </span>
                        <span className="line-clamp-1">
                          {event.guestCount || 0} guests
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-4 h-4 mt-0.5 mr-2 text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                        </span>
                        <span className="line-clamp-1">
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between pt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/events/${event.id}`}>
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Manage
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/rsvp/${event.id}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View RSVP
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 