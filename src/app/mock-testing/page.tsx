"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, RefreshCw, PlusCircle, User, Calendar } from "lucide-react";

export default function MockTestingPage() {
  const [isTestMode, setIsTestMode] = useState(false);
  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state for creating events
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    hostName: "",
    hostEmail: "",
  });
  
  // Form state for creating guests
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    response: "yes",
    plusOne: false,
    plusOneName: "",
    message: "",
  });
  
  // Fetch API data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if test mode is enabled
      const infoResponse = await fetch("/api/mock");
      const infoData = await infoResponse.json();
      setIsTestMode(infoData.testMode);
      
      if (!infoData.testMode) {
        setError("Test mode is not enabled. Please set USE_MOCK_DB=true in your .env file.");
        setLoading(false);
        return;
      }
      
      // Fetch events
      const eventsResponse = await fetch("/api/mock?action=events");
      const eventsData = await eventsResponse.json();
      setEvents(eventsData);
      
      if (eventsData.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsData[0].id);
      }
      
      // Fetch guests (all of them)
      const guestsResponse = await fetch("/api/mock?action=guests");
      const guestsData = await guestsResponse.json();
      setGuests(guestsData);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Make sure the server is running and test mode is enabled.");
    }
    
    setLoading(false);
  };
  
  // Reset all mock data
  const resetData = async () => {
    if (confirm("Are you sure you want to reset all mock data?")) {
      try {
        await fetch("/api/mock?action=reset");
        fetchData();
      } catch (err) {
        console.error("Error resetting data:", err);
        setError("Failed to reset data.");
      }
    }
  };
  
  // Create new event
  const createEvent = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/mock?action=createEvent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...eventForm,
          date: new Date(eventForm.date),
          adminToken: "testtoken" + Date.now(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form and refresh data
        setEventForm({
          name: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          location: "",
          hostName: "",
          hostEmail: "",
        });
        
        fetchData();
      } else {
        setError(data.error || "Failed to create event");
      }
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event");
    }
  };
  
  // Create new guest RSVP
  const createGuest = async (e) => {
    e.preventDefault();
    
    if (!selectedEventId) {
      setError("Please select an event first");
      return;
    }
    
    try {
      const response = await fetch("/api/mock?action=createGuest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...guestForm,
          eventId: selectedEventId,
          plusOne: guestForm.plusOne === "true",
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form and refresh data
        setGuestForm({
          name: "",
          email: "",
          response: "yes",
          plusOne: false,
          plusOneName: "",
          message: "",
        });
        
        fetchData();
      } else {
        setError(data.error || "Failed to create guest RSVP");
      }
    } catch (err) {
      console.error("Error creating guest:", err);
      setError("Failed to create guest RSVP");
    }
  };
  
  // Load data when component mounts
  useEffect(() => {
    fetchData();
  }, []);
  
  // Filter guests for selected event
  const filteredGuests = guests.filter(
    (guest) => guest.eventId === selectedEventId
  );
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex items-center mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mr-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Mock Testing Dashboard</h1>
        <Button 
          variant="outline"
          size="sm"
          className="ml-auto flex items-center"
          onClick={fetchData}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Button 
          variant="destructive"
          size="sm"
          className="ml-2 flex items-center"
          onClick={resetData}
        >
          Reset Data
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      ) : !isTestMode ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          Test mode is not enabled. Please set USE_MOCK_DB=true in your .env file and restart the server.
        </div>
      ) : (
        <Tabs defaultValue="events">
          <TabsList className="mb-6">
            <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
            <TabsTrigger value="guests">Guests ({guests.length})</TabsTrigger>
            <TabsTrigger value="create">Create Test Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events found. Create some test events first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    className={`overflow-hidden ${selectedEventId === event.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm">
                      <p className="mb-1 text-muted-foreground">{event.location}</p>
                      <p className="mb-2">
                        {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="line-clamp-2 text-muted-foreground">{event.description}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        ID: {event.id}
                      </div>
                      <div className="flex items-center text-xs font-medium">
                        <User className="h-3 w-3 mr-1" />
                        {filteredGuests.filter(g => g.eventId === event.id).length} RSVPs
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="guests">
            {!selectedEventId ? (
              <div className="text-center py-8 text-muted-foreground">
                Please select an event first to view guests.
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No guests found. Create some test RSVPs first.
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No guests found for this event. Create some test RSVPs for this event.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGuests.map((guest) => (
                  <Card key={guest.id}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{guest.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm">
                      <p className="mb-1 text-muted-foreground">{guest.email}</p>
                      <p className="mb-2">
                        Response: <span className={`font-medium ${
                          guest.response === 'yes' ? 'text-green-600' :
                          guest.response === 'no' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                          {guest.response}
                        </span>
                      </p>
                      {guest.plusOne && (
                        <p className="mb-2">
                          Plus One: {guest.plusOneName || 'Not specified'}
                        </p>
                      )}
                      {guest.message && (
                        <p className="text-muted-foreground line-clamp-2">
                          "{guest.message}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Create Test Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createEvent}>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Event Name</label>
                        <Input
                          value={eventForm.name}
                          onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                          placeholder="Summer Party"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={eventForm.description}
                          onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                          placeholder="Join us for a great time!"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <Input
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <Input
                          value={eventForm.location}
                          onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                          placeholder="123 Main St, City"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Host Name</label>
                        <Input
                          value={eventForm.hostName}
                          onChange={(e) => setEventForm({...eventForm, hostName: e.target.value})}
                          placeholder="John Smith"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Host Email</label>
                        <Input
                          type="email"
                          value={eventForm.hostEmail}
                          onChange={(e) => setEventForm({...eventForm, hostEmail: e.target.value})}
                          placeholder="host@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full mt-4">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Create Test RSVP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Create an event first to add RSVPs
                    </div>
                  ) : (
                    <form onSubmit={createGuest}>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Event</label>
                          <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            required
                          >
                            {events.map((event) => (
                              <option key={event.id} value={event.id}>
                                {event.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Guest Name</label>
                          <Input
                            value={guestForm.name}
                            onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
                            placeholder="Jane Doe"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <Input
                            type="email"
                            value={guestForm.email}
                            onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                            placeholder="guest@example.com"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Response</label>
                          <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={guestForm.response}
                            onChange={(e) => setGuestForm({...guestForm, response: e.target.value})}
                          >
                            <option value="yes">Yes, I'll attend</option>
                            <option value="no">No, I can't make it</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Plus One</label>
                          <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={guestForm.plusOne}
                            onChange={(e) => setGuestForm({...guestForm, plusOne: e.target.value})}
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>
                        
                        {guestForm.plusOne === "true" && (
                          <div>
                            <label className="block text-sm font-medium mb-1">Plus One Name</label>
                            <Input
                              value={guestForm.plusOneName}
                              onChange={(e) => setGuestForm({...guestForm, plusOneName: e.target.value})}
                              placeholder="Guest's Name"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Message</label>
                          <Textarea
                            value={guestForm.message}
                            onChange={(e) => setGuestForm({...guestForm, message: e.target.value})}
                            placeholder="Looking forward to it!"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full mt-4">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Submit RSVP
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 