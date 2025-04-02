"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Copy, Calendar, MapPin, User, Trash, Edit, ChevronLeft, Menu, X, LogOut, MessageSquare, Building, FileText, File } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

interface EventData {
  id: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  hostName?: string;
  guestCount: number;
  venue?: string;
  imageUrl?: string;
  dressCode?: string;
  instructions?: string;
}

interface GuestData {
  id: string;
  name: string;
  email: string;
  response: "attending" | "declined";
  numberOfGuests: number;
  additionalGuestNames?: string[];
  dietaryRestrictions?: string;
  message?: string;
  createdAt: string;
}

export default function EventPage() {
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
    totalGuests: 0,
    responseRate: 0,
    totalInvited: 0
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteGuestDialogOpen, setDeleteGuestDialogOpen] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isDeletingGuest, setIsDeletingGuest] = useState(false);

  // Add expanded cards state
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Function to toggle card expansion
  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/events/" + eventId);
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
      const totalResponded = attending + declined;
      
      // Calculate total guests including additional guests
      let totalAttending = 0;
      data.guests.forEach((guest: GuestData) => {
        if (guest.response === "attending") {
          totalAttending += guest.numberOfGuests;
        }
      });
      
      // Use event.guestCount if available, otherwise use the count of invited guests
      const totalInvited = event?.guestCount || data.guests.length;
      
      // Calculate response rate
      const responseRate = totalInvited > 0 ? Math.round((totalResponded / totalInvited) * 100) : 0;
      
      setStats({
        attending: totalAttending,
        declined,
        totalGuests: totalAttending,
        responseRate,
        totalInvited
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
  
  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      toast.success('Event deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    setSelectedGuestId(guestId);
    setDeleteGuestDialogOpen(true);
  };

  const confirmDeleteGuest = async () => {
    if (!selectedGuestId) return;
    
    setIsDeletingGuest(true);
    try {
      const response = await fetch(`/api/events/${eventId}/guests/${selectedGuestId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete guest');
      }
      
      toast.success('Guest deleted successfully');
      fetchGuests(); // Refresh guest list
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to delete guest');
    } finally {
      setIsDeletingGuest(false);
      setDeleteGuestDialogOpen(false);
      setSelectedGuestId(null);
    }
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
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
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary transition-colors w-full justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        </div>
      </div>

      <div className="flex mt-16 min-h-[calc(100vh-64px)]">
        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
              <p className="text-muted-foreground">
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                {event.time && ` at ${event.time}`}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link href={`/events/${event.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link href={`/rsvp/${event.id}`} target="_blank">
                  <Copy className="h-4 w-4 mr-2" />
                  View RSVP Page
                </Link>
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Add cover image if available */}
          {event.imageUrl && (
            <div className="w-full h-64 md:h-80 mb-6 rounded-lg overflow-hidden relative">
              <Image 
                src={event.imageUrl} 
                alt={event.name} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                      {event.time && ` at ${event.time}`}
                    </p>
                  </div>
                </div>
                
                {event.venue && (
                  <div className="flex items-start gap-2">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-sm text-muted-foreground">{event.venue}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
                
                {event.description && (
                  <div className="flex items-start gap-2">
                    <File className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <div>
                      <p className="font-medium">Description</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                )}
                
                {event.dressCode && (
                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Dress Code</p>
                      <p className="text-sm text-muted-foreground">{event.dressCode}</p>
                    </div>
                  </div>
                )}
                
                {event.instructions && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Special Instructions</p>
                      <p className="text-sm text-muted-foreground">{event.instructions}</p>
                    </div>
                  </div>
                )}
                
                {event.hostName && (
                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Hosted by</p>
                      <p className="text-sm text-muted-foreground">{event.hostName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Guest Count</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Attending</p>
                    <span className="text-sm font-medium text-green-600">{stats.attending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Declined</p>
                    <span className="text-sm font-medium text-red-600">{stats.declined}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-sm">Response Rate</p>
                    <div className="flex items-center">
                      <div className="w-36 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${stats.responseRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.responseRate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <p className="font-medium">Total Guests</p>
                    <span className="font-medium">{stats.totalGuests}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-2 rounded-lg">
                    <QRCodeSVG 
                      value={`${window.location.origin}/rsvp/${event.id}`} 
                      size={150}
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => copyToClipboard(
                    `${window.location.origin}/rsvp/${event.id}`,
                    "RSVP link copied to clipboard"
                  )}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy RSVP Link
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-6">
            <Tabs defaultValue="guests">
              <TabsList>
                <TabsTrigger value="guests">Guests ({guests.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="guests" className="mt-6">
                {guestsLoading ? (
                  <div className="flex justify-center my-12">
                    <div className="animate-pulse text-center">
                      <p className="text-muted-foreground">Loading guests...</p>
                    </div>
                  </div>
                ) : guests.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">No guests have responded yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => copyToClipboard(
                        `${window.location.origin}/rsvp/${event.id}`,
                        "RSVP link copied to clipboard"
                      )}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy RSVP Link to Share
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guests.map((guest) => (
                      <Card key={guest.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {guest.name}
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  guest.response === "attending" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                )}>
                                  {guest.response === "attending" ? "Attending" : "Declined"}
                                </span>
                              </CardTitle>
                              <CardDescription>{guest.email}</CardDescription>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteGuest(guest.id)}
                            >
                              <Trash className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm pb-2">
                          <div className="grid grid-cols-1 gap-1">
                            {guest.response === "attending" && (
                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>
                                  {guest.numberOfGuests > 1 
                                    ? `${guest.numberOfGuests} guests total` 
                                    : "1 guest"}
                                </span>
                              </div>
                            )}
                            
                            {guest.message && (
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{guest.message}</span>
                              </div>
                            )}
                            
                            {guest.dietaryRestrictions && (
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>Dietary needs: {guest.dietaryRestrictions}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 pb-3">
                          <p className="text-xs text-muted-foreground">
                            Responded on {format(new Date(guest.createdAt), "MMM d, yyyy")}
                          </p>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event and all associated guests. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={deleteGuestDialogOpen} onOpenChange={setDeleteGuestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this guest? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGuest}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGuest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingGuest}
            >
              {isDeletingGuest ? "Deleting..." : "Delete Guest"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 