"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Copy, 
  Download, 
  MapPin, 
  Share 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";

interface EventDetails {
  id: string;
  name: string;
  description: string;
  date: Date | string;
  location: string;
  hostName: string;
  hostEmail: string;
  imageUrl?: string;
  dressCode?: string;
}

export default function InvitationsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const invitationRef = useRef<HTMLDivElement>(null);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Admin token is required');
      setLoading(false);
      return;
    }
    
    // Set default share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    setShareUrl(`${baseUrl}/rsvp/${eventId}`);
    
    fetchEventData();
  }, [eventId, token]);

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to load event details');
      }
      
      const data = await response.json();
      
      // Convert date strings to Date objects
      setEvent({
        ...data,
        date: new Date(data.date)
      });
      
      // Format date for the message
      const formattedDate = new Date(data.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Set default share message
      setShareMessage(
        `You're invited to ${data.name}!\n\n` +
        `Date: ${formattedDate}\n` +
        `Location: ${data.location}\n\n` +
        `Please RSVP at: ${shareUrl}`
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Copied!",
      description: "RSVP URL copied to clipboard",
    });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    toast({
      title: "Copied!",
      description: "Invitation message copied to clipboard",
    });
  };

  const handleDownloadInvitation = async () => {
    if (!invitationRef.current) return;
    
    try {
      const canvas = await html2canvas(invitationRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `invitation-${eventId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Downloaded!",
        description: "Invitation image has been downloaded",
      });
    } catch (error) {
      console.error("Error generating invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download invitation",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading invitation details...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push(`/admin/events/${params.id}?token=${token}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invitation Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Invitation Preview</CardTitle>
            <CardDescription>
              Preview and download the invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div 
              ref={invitationRef} 
              className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md aspect-[3/4] flex flex-col"
            >
              {event.imageUrl && (
                <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-6">
                  <img 
                    src={event.imageUrl} 
                    alt={event.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="text-center mb-6 flex-grow">
                <h2 className="text-3xl font-serif mb-2">{event.name}</h2>
                <p className="text-muted-foreground mb-4">{event.description}</p>
                
                <div className="flex items-center justify-center text-sm mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {eventDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center justify-center text-sm mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{event.location}</span>
                </div>
                
                {event.dressCode && (
                  <Badge variant="outline" className="mx-auto mb-4">
                    {event.dressCode}
                  </Badge>
                )}
                
                <p className="text-sm font-medium mb-1">Hosted by</p>
                <p className="text-muted-foreground">{event.hostName}</p>
              </div>
              
              <div className="flex flex-col items-center">
                <p className="text-sm mb-2">Please RSVP by scanning the code below</p>
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG 
                    value={shareUrl}
                    size={120}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Or visit: {new URL(shareUrl).pathname}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={handleDownloadInvitation}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sharing Options */}
        <Card>
          <CardHeader>
            <CardTitle>Share Options</CardTitle>
            <CardDescription>
              Share your event invitation with guests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="rsvp-url">RSVP Link</Label>
              <div className="flex gap-2">
                <Input 
                  id="rsvp-url" 
                  value={shareUrl} 
                  onChange={(e) => setShareUrl(e.target.value)}
                  readOnly
                />
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="share-message">Invitation Message</Label>
              <div className="flex flex-col gap-2">
                <textarea
                  id="share-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button variant="outline" onClick={handleCopyMessage} className="self-end">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Message
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Share via</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(`Invitation: ${event.name}`)}&body=${encodeURIComponent(shareMessage)}`)}>
                  Email
                </Button>
                <Button variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`)}>
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={() => window.open(`sms:?&body=${encodeURIComponent(shareMessage)}`)}>
                  SMS
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">QR Code</p>
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG 
                    value={shareUrl}
                    size={120}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <Button variant="outline" onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const image = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = image;
                    link.download = `qrcode-${eventId}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 