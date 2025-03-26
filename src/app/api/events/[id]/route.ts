import { db } from "@/lib/firebase";
import { Event, eventConverter } from "@/lib/models";
import { doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, or } from "firebase/firestore";
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    // Get searchParams from the URL
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    let eventData: EventData;
    
    if (isTestMode) {
      // Dynamically import mockdb for server-side mock data
      const { getEventById } = await import("@/lib/mockdb");
      const mockEvent = await getEventById(eventId);
      if (!mockEvent) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      eventData = mockEvent as EventData;
    } else {
      // Get user session for authentication
      const session = await auth();
      const userId = session?.user?.id;
      
      console.log(`Fetching event ${eventId} for user ${userId}`);
      
      // First try getting the event directly by document ID
      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnapshot = await getDoc(eventRef);
        
        if (eventSnapshot.exists()) {
          eventData = { id: eventSnapshot.id, ...eventSnapshot.data() } as EventData;
          console.log("Found event by document ID");
        } else {
          // If not found by document ID, try the query with "id" field
          console.log("Event not found by document ID, trying query with id field");
          const eventsRef = collection(db, "events");
          const q = query(eventsRef, where("id", "==", eventId));
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
    }
    
    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error getting event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
} 