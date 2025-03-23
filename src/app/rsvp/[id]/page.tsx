"use client";

import { useState, useEffect } from "react";
import { Sparkles, Calendar, MapPin, User, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Event } from "@/lib/models";
import { useParams } from "next/navigation";

// Utility function to format date
const formatDate = (date: Date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Type for form data
interface FormData {
  name: string;
  email: string;
  response: 'yes' | 'no' | 'maybe';
  plusOne: boolean;
  plusOneName?: string;
  message?: string;
}

// RSVP Form Component
const RsvpForm = ({ 
  onSubmit, 
  onChange, 
  formData, 
  isSubmitting 
}: { 
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: FormData) => void;
  formData: FormData;
  isSubmitting: boolean;
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input 
          id="name" 
          placeholder="Enter your name" 
          value={formData.name}
          onChange={(e) => onChange({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="your.email@example.com" 
          value={formData.email}
          onChange={(e) => onChange({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Will you attend?</Label>
        <RadioGroup 
          value={formData.response} 
          onValueChange={(value) => onChange({...formData, response: value as 'yes' | 'no' | 'maybe'})}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes, I'll be there</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No, I can't make it</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="maybe" id="maybe" />
            <Label htmlFor="maybe">Maybe</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="plusOne" 
          checked={formData.plusOne}
          onCheckedChange={(checked) => onChange({...formData, plusOne: checked as boolean})}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="plusOne">Bringing a guest?</Label>
          <p className="text-sm text-muted-foreground">Let us know if you're bringing someone</p>
        </div>
      </div>
      
      {formData.plusOne && (
        <div className="space-y-2">
          <Label htmlFor="plusOneName">Guest's Name</Label>
          <Input 
            id="plusOneName" 
            placeholder="Your guest's name" 
            value={formData.plusOneName || ''}
            onChange={(e) => onChange({...formData, plusOneName: e.target.value})}
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea 
          id="message" 
          placeholder="Any message for the host..." 
          value={formData.message || ''}
          onChange={(e) => onChange({...formData, message: e.target.value})}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
      </Button>
    </form>
  );
};

// RSVP Confirmation Component
const RsvpConfirmation = ({ 
  formData, 
  event 
}: { 
  formData: FormData;
  event: Event;
}) => {
  return (
    <div className="space-y-4 text-center">
      <Sparkles className="h-12 w-12 mx-auto text-primary" />
      <h2 className="text-xl font-semibold">Thank You!</h2>
      <p className="text-muted-foreground">
        {formData.response === 'yes' 
          ? `We're looking forward to seeing you${formData.plusOne ? ' and your guest' : ''}!` 
          : formData.response === 'no'
            ? "We're sorry you can't make it, but thank you for letting us know."
            : "Thank you for your response. We hope you can make it!"}
      </p>
      <p className="text-sm text-muted-foreground">
        You'll receive a confirmation email shortly.
      </p>
    </div>
  );
};

export default function RsvpPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    response: 'yes',
    plusOne: false,
    plusOneName: '',
    message: ''
  });

  useEffect(() => {
    // Function to fetch event data
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load event details');
        }
        
        const data = await response.json();
        setEvent({
          ...data,
          date: new Date(data.date)
        });
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Unable to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit RSVP');
      }
      
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      setError('Failed to submit your RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="h-16 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">SaveTheDate</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 md:py-10 md:px-6 flex flex-col items-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary"></div>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground">Loading event details...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="max-w-md w-full mt-6 md:mt-8 text-sm md:text-base">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : event && (
          <div className="w-full max-w-lg mx-auto space-y-6 md:space-y-8">
            {/* Event Header */}
            <div className="text-center space-y-3 md:space-y-4">
              {event.imageUrl && (
                <div className="w-full h-40 md:h-64 rounded-xl overflow-hidden">
                  <img 
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold mt-4 md:mt-6">{event.name}</h1>
              <div className="flex flex-col gap-1.5 md:gap-2">
                <div className="inline-flex items-center justify-center gap-1 text-muted-foreground text-sm md:text-base">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>{event.date ? formatDate(event.date) : ''}</span>
                </div>
                <div className="inline-flex items-center justify-center gap-1 text-muted-foreground text-sm md:text-base">
                  <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>{event.location}</span>
                </div>
                <div className="inline-flex items-center justify-center gap-1 text-muted-foreground text-sm md:text-base">
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Hosted by {event.hostName}</span>
                </div>
              </div>
              {event.description && (
                <p className="mt-2 text-sm md:text-base text-muted-foreground">{event.description}</p>
              )}
            </div>

            {submitted ? (
              <RsvpConfirmation formData={formData} event={event} />
            ) : (
              <RsvpForm 
                onSubmit={handleSubmit} 
                onChange={setFormData} 
                formData={formData}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
} 