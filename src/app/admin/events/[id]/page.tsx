"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { AlertCircle, Calendar, Download, MapPin, QrCode, RefreshCcw, Share, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatDistanceToNow } from "date-fns";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface EventDetails {
  id: string;
  name: string;
  description: string;
  date: Date | string;
  location: string;
  hostName: string;
  hostEmail: string;
  guestCount?: number;
  respondedCount?: number;
  attendingCount?: number;
  declinedCount?: number;
  imageUrl?: string;
  adminToken?: string;
}

interface GuestResponse {
  id: string;
  name: string;
  email: string;
  response: 'yes' | 'no' | 'maybe';
  plusOne: boolean;
  plusOneName?: string;
  message?: string;
  createdAt: string;
}

export default function EventDashboard() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [guests, setGuests] = useState<GuestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No admin token provided');
      setLoading(false);
      return;
    }
    
    fetchEventData();
  }, [eventId, token]);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const eventResponse = await fetch(`/api/events/${eventId}?token=${token}`);
      
      if (!eventResponse.ok) {
        if (eventResponse.status === 404) {
          throw new Error('Event not found');
        } else if (eventResponse.status === 401) {
          throw new Error('Invalid admin token');
        } else {
          throw new Error('Failed to load event details');
        }
      }
      
      const eventData = await eventResponse.json();
      
      // Fetch guests for this event
      const guestsResponse = await fetch(`/api/events/${eventId}/guests?token=${token}`);
      
      if (!guestsResponse.ok) {
        throw new Error('Failed to load guest data');
      }
      
      const guestsData = await guestsResponse.json();
      
      // Calculate statistics
      const attendingCount = guestsData.filter((g: GuestResponse) => g.response === 'yes').length;
      const declinedCount = guestsData.filter((g: GuestResponse) => g.response === 'no').length;
      const respondedCount = guestsData.length;
      
      // Format event data
      setEvent({
        ...eventData,
        date: new Date(eventData.date),
        guestCount: guestsData.length,
        respondedCount,
        attendingCount,
        declinedCount
      });
      
      // Set recent activity (latest 5 responses)
      const sortedGuests = [...guestsData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
      
      setGuests(sortedGuests);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const guestsResponse = await fetch(`/api/events/${eventId}/guests?token=${token}`);
      
      if (!guestsResponse.ok) {
        const errorData = await guestsResponse.json();
        throw new Error(errorData.error || "Failed to fetch guests");
      }
      
      const guestsData = await guestsResponse.json();
      setGuests(guestsData);
      
      // Update stats
      const guestCount = guestsData.length;
      const respondedCount = guestsData.filter((guest: GuestResponse) => guest.response).length;
      const attendingCount = guestsData.filter((guest: GuestResponse) => guest.response === 'yes').length;
      const declinedCount = guestsData.filter((guest: GuestResponse) => guest.response === 'no').length;
      
      if (event) {
        setEvent({
          ...event,
          guestCount,
          respondedCount,
          attendingCount,
          declinedCount
        });
      }
      
      toast({
        title: "Data refreshed",
        description: "Guest list has been updated with the latest data",
      });
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh guest data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!event) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Event Not Found</AlertTitle>
        <AlertDescription>
          The event you're looking for doesn't exist or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  const eventDate = new Date(event.date);
  const rsvpPercentage = event.guestCount && event.guestCount > 0 
    ? Math.round((event.respondedCount || 0) / event.guestCount * 100) 
    : 0;

  // Display QR code or invitation link
  const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/rsvp/${eventId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-muted-foreground">
            <span className="inline-flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="mx-2">•</span>
            <span className="inline-flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {event.location}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-9">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={refreshData}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="default" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Guests" 
          value={event.guestCount || 0} 
          icon={<Users className="h-5 w-5 text-muted-foreground" />} 
        />
        <StatCard 
          title="Response Rate" 
          value={`${rsvpPercentage}%`} 
          subtitle={`${event.respondedCount || 0} of ${event.guestCount || 0} responded`}
          icon={<Chart value={rsvpPercentage} />} 
        />
        <StatCard 
          title="Attending" 
          value={event.attendingCount || 0} 
          subtitle={`${event.guestCount ? Math.round(((event.attendingCount || 0) / event.guestCount) * 100) : 0}% of guests`}
          icon={<CheckIcon />} 
        />
        <StatCard 
          title="Declined" 
          value={event.declinedCount || 0} 
          subtitle={`${event.guestCount ? Math.round(((event.declinedCount || 0) / event.guestCount) * 100) : 0}% of guests`}
          icon={<XIcon />} 
        />
      </div>

      {/* Content Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
        {/* Share & Invite Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Invitation Link</CardTitle>
            <CardDescription>Share this link with your guests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md text-sm break-all">
                <code>{invitationUrl}</code>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    navigator.clipboard.writeText(invitationUrl);
                    toast({
                      title: "Link copied",
                      description: "Invitation link copied to clipboard",
                    });
                  }}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.open(`/admin/events/${eventId}/invitations?token=${token}`)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate Invitations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* QR Code Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scan to access event page</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG value={invitationUrl} size={150} />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => {
                // Implementation for downloading QR code
                const svg = document.querySelector('.bg-white.p-3.rounded-lg svg');
                if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    const pngFile = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.download = `qrcode-${eventId}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                  };
                  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>
        
        {/* Recent Activity Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Guest Management</CardTitle>
            <CardDescription>
              Manage your guest list and invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.open(`/admin/events/${eventId}/guests?token=${token}`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Guest List
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => router.push(`/admin/events/${eventId}/invitations?token=${token}`)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Generate Invitations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Chart({ value }: { value: number }) {
  return (
    <div className="relative h-10 w-10">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/20"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={`${value * 2.51} 251`}
          strokeDashoffset="0"
          className="text-primary"
          transform="rotate(-90 50 50)"
        />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
}

function XIcon() {
  return (
    <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  );
}

function ActivityItem({ type, name, time, status }: {
  type: 'rsvp' | 'invite';
  name: string;
  time: string;
  status: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 ${
        status === 'accepted' ? 'bg-emerald-500' :
        status === 'declined' ? 'bg-rose-500' : 'bg-blue-500'
      }`} />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {name} {type === 'rsvp' ? 'RSVP\'d' : 'was invited'} 
          {status === 'accepted' ? ' (Attending)' : 
           status === 'declined' ? ' (Not Attending)' : ''}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
} 