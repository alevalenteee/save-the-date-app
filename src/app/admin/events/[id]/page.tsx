"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Copy, Calendar, MapPin, User, Trash, Share, Edit, ChevronLeft, Menu, X, Clipboard, Mail, ExternalLink, MessageSquare, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
  hostName?: string;
  guestCount: number;
  venue?: string;
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
    totalGuests: 0
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
      
      // Calculate total guests including additional guests
      let totalAttending = 0;
      data.guests.forEach((guest: GuestData) => {
        if (guest.response === "attending") {
          totalAttending += guest.numberOfGuests;
        }
      });
      
      setStats({
        attending: totalAttending,
        declined,
        totalGuests: totalAttending
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
  
  const eventLink = `${window.location.origin}/rsvp/${eventId}`;

  const renderQRCode = () => {
    if (!event) return null;
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const rsvpUrl = `${baseUrl}/rsvp/${event.id}`;
    
    return (
      <div className="mt-6 flex flex-col items-center md:flex-row md:items-start gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <QRCodeSVG
            value={rsvpUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        <div className="space-y-3">
          <h3 className="font-medium">QR Code for Event</h3>
          <p className="text-sm text-muted-foreground">
            Share this QR code with your guests so they can quickly access the RSVP page.
            When scanned, it will take them directly to your event's RSVP page.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const canvas = document.querySelector('#event-qr-code canvas') as HTMLCanvasElement;
              if (canvas) {
                const image = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = image;
                link.download = `qrcode-${event.id}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("QR code downloaded successfully");
              } else {
                toast.error("Failed to download QR code");
              }
            }}
          >
            Download QR Code
          </Button>
        </div>
      </div>
    );
  };

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
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <p className="text-muted-foreground">
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setDeleteDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Trash className="h-4 w-4" />
              <span className="hidden sm:inline">Delete Event</span>
            </Button>
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">{event.name}</CardTitle>
                        <CardDescription>Event Details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(event.date), 'PPP')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        {event.venue && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{event.venue}</span>
                          </div>
                        )}
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
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
        
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
                      {guests.map((guest) => (
                        <div 
                          key={guest.id} 
                          className={cn(
                            "bg-card rounded-lg border overflow-hidden hover:shadow-md transition-all",
                            expandedCards[guest.id] ? "ring-2 ring-primary/10" : ""
                          )}
                        >
                          <div className="p-4">
                            {/* Card Header with button - always visible */}
                            <div className="flex justify-between items-start">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => toggleCardExpansion(guest.id)}
                              >
                                <div className="mb-2">
                                  <h3 className="font-medium text-xl">{guest.name}</h3>
                                  <a 
                                    href={`mailto:${guest.email}`} 
                                    className="text-sm text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {guest.email}
                                  </a>
                                </div>
                                
                                {/* Status badges - always visible */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className={cn(
                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                    guest.response === "attending" && "bg-green-100 text-green-800",
                                    guest.response === "declined" && "bg-red-100 text-red-800"
                                  )}>
                                    {guest.response === "attending" && "Attending"}
                                    {guest.response === "declined" && "Declined"}
                                  </span>
                                  
                                  {guest.response === "attending" && (
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                      {guest.numberOfGuests} {guest.numberOfGuests === 1 ? 'guest' : 'guests'}
                                    </span>
                                  )}
                                  
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                    {format(new Date(guest.createdAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCardExpansion(guest.id);
                                  }}
                                >
                                  {expandedCards[guest.id] ? (
                                    <ChevronLeft className="h-5 w-5 rotate-90" />
                                  ) : (
                                    <ChevronLeft className="h-5 w-5 -rotate-90" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGuest(guest.id);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </div>
                            
                            {/* Expandable details - only visible when expanded */}
                            {expandedCards[guest.id] && (
                              <div className="mt-4 pt-3 border-t space-y-4 animate-in fade-in-50 duration-200">
                                {guest.additionalGuestNames && guest.additionalGuestNames.length > 0 && (
                                  <div>
                                    <h4 className="text-xs uppercase text-muted-foreground mb-2 font-semibold">Additional Guests</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {guest.additionalGuestNames.map((name, i) => (
                                        <div key={i} className="flex items-center p-2 bg-muted/30 rounded-md">
                                          <User className="h-3.5 w-3.5 mr-2 text-green-600" />
                                          <span className="text-sm font-medium">{name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {guest.dietaryRestrictions && (
                                  <div>
                                    <h4 className="text-xs uppercase text-muted-foreground mb-1 font-semibold">Dietary Restrictions</h4>
                                    <div className="bg-muted/30 p-2 rounded-md">
                                      <p className="text-sm">{guest.dietaryRestrictions}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {guest.message && (
                                  <div>
                                    <h4 className="text-xs uppercase text-muted-foreground mb-1 font-semibold">Message</h4>
                                    <div className="bg-muted/30 p-2 rounded-md">
                                      <p className="text-sm italic">"{guest.message}"</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
            
            <div id="event-qr-code">
              {renderQRCode()}
            </div>
          </CardContent>
        </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Delete Event Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone
              and all guest RSVPs will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                handleDeleteEvent();
              }}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Event"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Guest Dialog */}
      <AlertDialog open={deleteGuestDialogOpen} onOpenChange={setDeleteGuestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Guest
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this guest from your event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGuest}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                confirmDeleteGuest();
              }}
              disabled={isDeletingGuest}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeletingGuest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Guest"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 