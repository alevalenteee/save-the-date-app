"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Copy, Calendar, MapPin, User, Trash, Share, Edit, ChevronLeft, Menu, X, Clipboard, Mail, ExternalLink, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
  hostName?: string;
  guestCount: number;
}

interface GuestData {
  id: string;
  name: string;
  email: string;
  response: "attending" | "declined" | "maybe";
  numberOfGuests: number;
  dietaryRestrictions?: string;
  message?: string;
  createdAt: string;
}

export default function EventAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState("");
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    attending: 0,
    declined: 0,
    maybe: 0,
    totalGuests: 0
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/admin/events/" + eventId);
    }
    
    if (status === "authenticated") {
      fetchEvent();
    }
  }, [status, router, eventId]);
  
  const fetchEvent = async () => {
    try {
      setLoading(true);
      console.log(`Fetching event with ID: ${eventId}`);
      
      // Use a more detailed fetch with error handling
      const response = await fetch(`/api/events/${eventId}`);
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Fetch failed with status ${response.status}`, errorData);
        throw new Error(`Failed to fetch event: ${response.status} ${errorData.error || ''}`);
      }
      
      const data = await response.json();
      console.log("Event data received:", data);
      setEvent(data);
      
      // After event is loaded, fetch guests
      fetchGuests();
    } catch (err) {
      console.error("Error fetching event:", err);
      setError(`Failed to load event details: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      setGuestsLoading(true);
      const response = await fetch(`/api/events/${eventId}/guests`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch guests");
      }
      
      const data = await response.json();
      setGuests(data.guests || []);
      
      // Calculate stats
      const attending = data.guests.filter((g: GuestData) => g.response === "attending").length;
      const declined = data.guests.filter((g: GuestData) => g.response === "declined").length;
      const maybe = data.guests.filter((g: GuestData) => g.response === "maybe").length;
      
      setStats({
        attending,
        declined,
        maybe,
        totalGuests: attending
      });
    } catch (err) {
      console.error("Error fetching guests:", err);
    } finally {
      setGuestsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(message);
        toast.success(message);
        setTimeout(() => setCopySuccess(""), 2000);
      },
      () => {
        toast.error("Failed to copy to clipboard");
      }
    );
  };
  
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-lg font-medium">Loading event...</h2>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              We couldn't find the event you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const eventLink = `${window.location.origin}/rsvp/${eventId}`;

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
              <Link href="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
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
              href="/dashboard" 
              className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </nav>
        </div>
      </div>

      <div className="flex mt-16 min-h-[calc(100vh-64px)]">
        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
            </p>
      </div>

          <Tabs defaultValue="guests">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="guests">Guests</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
        <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
          </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Event Name</Label>
                      <div className="font-medium">{event.name}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Date</Label>
                      <div className="font-medium">
                        {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Location</Label>
                      <div className="font-medium">{event.location}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Guest Count</Label>
                      <div className="font-medium">{stats.totalGuests} confirmed attendees</div>
                    </div>
                  </div>
                  
                  {event.description && (
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <div className="text-muted-foreground">{event.description}</div>
              </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button asChild variant="outline">
                      <Link href={`/rsvp/${event.id}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View RSVP Page
                      </Link>
                </Button>
                    <Button asChild>
                      <Link href={`/admin/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Event
                      </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
        
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total RSVPs</CardDescription>
                    <CardTitle className="text-2xl">
                      {guests.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Attending</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {stats.attending}
                    </CardTitle>
                  </CardHeader>
                </Card>
                
        <Card>
          <CardHeader className="pb-2">
                    <CardDescription>Declined</CardDescription>
                    <CardTitle className="text-2xl text-red-600">
                      {stats.declined}
                    </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
                    <CardDescription>Maybe</CardDescription>
                    <CardTitle className="text-2xl text-amber-600">
                      {stats.maybe}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>
            
            {/* Guests Tab */}
            <TabsContent value="guests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Guest List</CardTitle>
            <CardDescription>
                    Manage your event's guest list
            </CardDescription>
          </CardHeader>
          <CardContent>
                  {guestsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : guests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <h3 className="font-medium mb-1">No RSVPs Yet</h3>
                      <p>Share your event link to start collecting RSVPs</p>
                    </div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-3 font-medium">Name</th>
                            <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
                            <th className="text-left p-3 font-medium">Response</th>
                            <th className="text-left p-3 font-medium">Guests</th>
                            <th className="text-left p-3 font-medium hidden lg:table-cell">Date Added</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {guests.map((guest) => (
                            <tr key={guest.id} className="hover:bg-muted/50">
                              <td className="p-3">{guest.name}</td>
                              <td className="p-3 hidden md:table-cell">
                                <a 
                                  href={`mailto:${guest.email}`} 
                                  className="text-primary hover:underline"
                                >
                                  {guest.email}
                                </a>
                              </td>
                              <td className="p-3">
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                  guest.response === "attending" && "bg-green-100 text-green-800",
                                  guest.response === "declined" && "bg-red-100 text-red-800",
                                  guest.response === "maybe" && "bg-amber-100 text-amber-800"
                                )}>
                                  {guest.response === "attending" && "Attending"}
                                  {guest.response === "declined" && "Declined"}
                                  {guest.response === "maybe" && "Maybe"}
                                </span>
                              </td>
                              <td className="p-3">
                                {guest.response === "attending" ? guest.numberOfGuests : "-"}
                              </td>
                              <td className="p-3 hidden lg:table-cell text-muted-foreground text-sm">
                                {format(new Date(guest.createdAt), "MMM d, yyyy")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Share Tab */}
            <TabsContent value="share" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Share Your Event</CardTitle>
                  <CardDescription>
                    Send your event link to guests so they can RSVP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
            <div className="space-y-2">
                    <Label>Event Link</Label>
                    <div className="flex">
                      <Input 
                        readOnly 
                        value={eventLink} 
                        className="rounded-r-none"
                      />
              <Button 
                        type="button" 
                        variant="secondary" 
                        className="rounded-l-none"
                        onClick={() => copyToClipboard(eventLink, "Event link copied to clipboard!")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share this link with your guests so they can respond to your invitation.
                    </p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button asChild variant="outline">
                      <a 
                        href={`mailto:?subject=RSVP to ${encodeURIComponent(event.name)}&body=Please RSVP to my event: ${encodeURIComponent(eventLink)}`}
                        className="flex items-center"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Share via Email
                      </a>
              </Button>
                    
              <Button 
                variant="outline" 
                      onClick={() => copyToClipboard(eventLink, "Link copied! You can now paste it anywhere.")}
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    
                    <Button asChild variant="outline">
                      <Link href={`/rsvp/${event.id}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View RSVP Page
                      </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
} 