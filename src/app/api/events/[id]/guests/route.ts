import { db } from "@/lib/firebase";
import { Event, Guest, eventConverter, guestConverter } from "@/lib/models";
import { collection, query, where, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Check if we're running in test mode
const isTestMode = typeof window === 'undefined' && 
  process.env.NODE_ENV === 'development' && 
  process.env.USE_MOCK_DB === 'true';

// Interface for event data
interface EventData {
  id: string;
  userId?: string;
  accessToken?: string;
  [key: string]: any;
}

// Function to check if the user has access to the event
async function hasAccess(eventId: string, userId?: string | null) {
  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnapshot = await getDoc(eventRef);
    
    if (!eventSnapshot.exists()) {
      return false;
    }
    
    const eventData = eventSnapshot.data();
    
    // Check if the user is the owner of the event
    if (userId && eventData.userId === userId) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking access:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Getting guests for event ${params.id}`);
    // Get user session
    const session = await auth();
    const userId = session?.user?.id;
    console.log(`User ID from session: ${userId}`);
    
    // Get searchParams from the URL
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    console.log(`Token provided: ${token ? 'yes' : 'no'}`);
    
    if (!params.id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    let eventData: EventData;
    let guestsData;
    
    if (isTestMode) {
      console.log("Using mock data");
      // Dynamically import mockdb for server-side mock data
      const { getEventById, getGuests: getMockGuests } = await import("@/lib/mockdb");
      const mockEvent = await getEventById(params.id);
      if (!mockEvent) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      eventData = mockEvent as EventData;
      guestsData = await getMockGuests(params.id);
    } else {
      console.log("Using Firestore data");
      // First try getting the event directly by document ID
      try {
        const eventRef = doc(db, "events", params.id);
        const eventSnapshot = await getDoc(eventRef);
        
        if (eventSnapshot.exists()) {
          eventData = { id: eventSnapshot.id, ...eventSnapshot.data() } as EventData;
          console.log("Found event by document ID");
        } else {
          // If not found by document ID, try the query with "id" field
          console.log("Event not found by document ID, trying query with id field");
          const eventsRef = collection(db, "events");
          const q = query(eventsRef, where("id", "==", params.id));
          const eventsSnapshot = await getDocs(q);
          
          if (eventsSnapshot.empty) {
            console.log("Event not found with either method");
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
          }
          
          eventData = { id: eventsSnapshot.docs[0].id, ...eventsSnapshot.docs[0].data() } as EventData;
          console.log("Found event by id field query");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
      }
      
      // Check if user is authorized to access this event
      if (eventData.userId !== userId && token !== eventData.accessToken) {
        console.log(`Unauthorized: user ${userId} not owner of event (${eventData.userId}) and no valid token`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Get guests from Firestore
      console.log("Fetching guests...");
      const guestsRef = collection(db, "guests");
      const guestsQuery = query(guestsRef, where("eventId", "==", params.id));
      const guestsSnapshot = await getDocs(guestsQuery);
      
      guestsData = guestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`Found ${guestsData.length} guests`);
    }
    
    return NextResponse.json({ guests: guestsData });
    
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Check if event exists
    const eventRef = doc(db, "events", eventId);
    const eventSnapshot = await getDoc(eventRef);
    
    if (!eventSnapshot.exists()) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.response) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, and response are required" },
        { status: 400 }
      );
    }
    
    // Check for existing guest with same email
    const guestsRef = collection(db, "guests");
    const q = query(
      guestsRef, 
      where("eventId", "==", eventId),
      where("email", "==", body.email)
    );
    const existingGuests = await getDocs(q);
    
    // If guest with same email exists, update their RSVP instead of creating a new one
    if (!existingGuests.empty) {
      // For simplicity, we'll just create a new entry instead of updating
      // In a real app, you would update the existing entry
    }
    
    // Create guest data
    const guestData = {
      eventId,
      name: body.name,
      email: body.email,
      response: body.response,
      numberOfGuests: body.numberOfGuests || 1,
      dietaryRestrictions: body.dietaryRestrictions || "",
      message: body.message || "",
      createdAt: new Date().toISOString()
    };
    
    // Add the guest to Firestore
    const docRef = await addDoc(guestsRef, guestData);
    
    // Get the event data to update guest count
    const eventData = eventSnapshot.data();
    
    // Return success response
    return NextResponse.json(
      {
        id: docRef.id,
        ...guestData
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating guest:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    );
  }
} 