import { db } from "@/lib/firebase";
import { Event, Guest, eventConverter, guestConverter } from "@/lib/models";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to get mock event
async function getMockEvent(id: string): Promise<Event | null> {
  try {
    const filePath = path.join(process.cwd(), 'mock', 'data', 'events.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const events = JSON.parse(fileContents);
    
    // Find the event with the matching ID
    const event = events.find((event: any) => event.id === id);
    
    if (!event) {
      return null;
    }
    
    // Convert string dates to Date objects
    return {
      ...event,
      date: new Date(event.date),
      endDate: event.endDate ? new Date(event.endDate) : undefined,
      createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
      updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined
    };
  } catch (error) {
    console.error("Error reading mock data:", error);
    return null;
  }
}

// Helper function to get mock guests for an event
async function getMockGuests(eventId: string): Promise<Guest[]> {
  try {
    const filePath = path.join(process.cwd(), 'mock', 'data', 'guests.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const allGuests = JSON.parse(fileContents);
    
    // Filter guests for this event
    const eventGuests = allGuests.filter((guest: any) => guest.eventId === eventId);
    
    // Convert string dates to Date objects
    return eventGuests.map((guest: any) => ({
      ...guest,
      createdAt: guest.createdAt ? new Date(guest.createdAt) : new Date(),
      updatedAt: guest.updatedAt ? new Date(guest.updatedAt) : new Date()
    }));
  } catch (error) {
    console.error("Error reading mock guests data:", error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate event ID
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Check if this is an admin request (with token)
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    
    if (!token) {
      return NextResponse.json(
        { error: "Admin token is required" },
        { status: 401 }
      );
    }

    let event: Event | null = null;
    
    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      event = await getMockEvent(id);
    } else {
      // Get the event from Firestore
      const eventRef = doc(db, "events", id).withConverter(eventConverter);
      const eventSnapshot = await getDoc(eventRef);

      if (eventSnapshot.exists()) {
        event = eventSnapshot.data();
      }
    }

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Verify admin token
    if (token !== event.adminToken) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 401 }
      );
    }

    let guests: Guest[] = [];
    
    // Get all guests for this event
    if (process.env.USE_MOCK_DB === 'true') {
      guests = await getMockGuests(id);
    } else {
      // Get guests from Firestore
      const guestsRef = collection(db, "guests");
      const q = query(
        guestsRef,
        where("eventId", "==", id)
      );
      
      const querySnapshot = await getDocs(q.withConverter(guestConverter));
      guests = querySnapshot.docs.map(doc => doc.data());
    }

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
} 