"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, MapPin, Clock, Send, Loader2, Plus, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
  hostName?: string;
}

export default function RSVPPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [response, setResponse] = useState<"attending" | "declined" | "">("");
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [additionalGuests, setAdditionalGuests] = useState<Array<{firstName: string, lastName: string}>>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Update additional guest fields when number of guests changes
  useEffect(() => {
    const guestCount = parseInt(numberOfGuests, 10);
    if (guestCount > 1) {
      // Adjust additional guests array to match the number of additional guests
      setAdditionalGuests(prev => {
        const newArray = [...prev];
        // If more guests added, add empty objects
        while (newArray.length < guestCount - 1) {
          newArray.push({ firstName: '', lastName: '' });
        }
        // If fewer guests, truncate the array
        if (newArray.length > guestCount - 1) {
          return newArray.slice(0, guestCount - 1);
        }
        return newArray;
      });
    } else {
      setAdditionalGuests([]);
    }
  }, [numberOfGuests]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/public`);
        
        if (!res.ok) {
          throw new Error("Event not found");
        }
        
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("We couldn't find the event you're looking for");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset validation errors
    setValidationErrors({});
    
    // Collect validation errors
    const errors: Record<string, boolean> = {};
    
    if (!firstName) errors.firstName = true;
    if (!lastName) errors.lastName = true;
    if (!email) errors.email = true;
    if (!response) errors.response = true;
    
    // Validate additional guests if attending with guests
    if (response === "attending" && parseInt(numberOfGuests, 10) > 1) {
      additionalGuests.forEach((guest, index) => {
        if (!guest.firstName) errors[`additionalGuest${index}FirstName`] = true;
        if (!guest.lastName) errors[`additionalGuest${index}LastName`] = true;
      });
    }
    
    // If there are validation errors, display them and stop submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Combine first and last names for API submission
      const fullName = `${firstName} ${lastName}`;
      const additionalGuestNames = additionalGuests.map(guest => 
        `${guest.firstName} ${guest.lastName}`
      );
      
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email,
          response,
          numberOfGuests: parseInt(numberOfGuests, 10),
          additionalGuestNames,
          dietaryRestrictions,
          message,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit RSVP");
      }
      
      toast.success("Your RSVP has been submitted!");
      
      // Clear form
      setFirstName("");
      setLastName("");
      setEmail("");
      setResponse("");
      setNumberOfGuests("1");
      setAdditionalGuests([]);
      setDietaryRestrictions("");
      setMessage("");
      
      // Redirect to confirmation page
      router.push(`/rsvp/${eventId}/thank-you`);
    } catch (err) {
      console.error("Error submitting RSVP:", err);
      toast.error("Failed to submit RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Update additional guest at specified index
  const handleAdditionalGuestChange = (index: number, field: 'firstName' | 'lastName', value: string) => {
    setAdditionalGuests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-lg font-medium">Loading event details...</h2>
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
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
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

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            
            {event.hostName && (
              <p className="text-lg mb-6">Hosted by {event.hostName}</p>
            )}
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mt-0.5 mr-3 text-primary" />
                <div>
                  <h3 className="font-medium">Date & Time</h3>
                  <p>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>
                </div>
                </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mt-0.5 mr-3 text-primary" />
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p>{event.location}</p>
                </div>
              </div>
            </div>

            {event.description && (
              <div className="mb-8">
                <h3 className="font-medium mb-2">About this event</h3>
                <p className="text-muted-foreground">{event.description}</p>
              </div>
            )}
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>RSVP to this event</CardTitle>
                <CardDescription>
                  Please let us know if you can attend
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={validationErrors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={validationErrors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={validationErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className={validationErrors.response ? "text-red-500" : ""}>Will you attend? *</Label>
                    <RadioGroup
                      value={response}
                      onValueChange={(value) => setResponse(value as any)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="attending" id="attending" />
                        <Label htmlFor="attending" className="cursor-pointer">Yes, I'll be there</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="declined" id="declined" />
                        <Label htmlFor="declined" className="cursor-pointer">No, I can't make it</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {response === "attending" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="guests">Number of Guests (including you)</Label>
                        <Input
                          id="guests"
                          type="number"
                          min="1"
                          max="10"
                          value={numberOfGuests}
                          onChange={(e) => setNumberOfGuests(e.target.value)}
                        />
                      </div>
                      
                      {parseInt(numberOfGuests, 10) > 1 && (
                        <div className="space-y-3">
                          <Label>Additional Guests *</Label>
                          {additionalGuests.map((guest, index) => (
                            <div key={index} className="grid grid-cols-2 gap-2">
                              <div>
                                <Input
                                  value={guest.firstName}
                                  onChange={(e) => handleAdditionalGuestChange(index, 'firstName', e.target.value)}
                                  placeholder="First Name *"
                                  className={validationErrors[`additionalGuest${index}FirstName`] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                  required
                                />
                              </div>
                              <div>
                                <Input
                                  value={guest.lastName}
                                  onChange={(e) => handleAdditionalGuestChange(index, 'lastName', e.target.value)}
                                  placeholder="Last Name *"
                                  className={validationErrors[`additionalGuest${index}LastName`] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                  required
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="dietary">Dietary Restrictions</Label>
                        <Input
                          id="dietary"
                          value={dietaryRestrictions}
                          onChange={(e) => setDietaryRestrictions(e.target.value)}
                          placeholder="Vegetarian, gluten-free, etc."
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Any additional information you'd like to share"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send RSVP
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
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