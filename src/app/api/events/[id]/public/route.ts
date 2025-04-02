import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = await params;
    
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    
    // Get event from Firestore
    const eventRef = doc(db, "events", eventId);
    const eventSnapshot = await getDoc(eventRef);
    
    if (!eventSnapshot.exists()) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Return public event data
    const eventData = eventSnapshot.data();
    
    // Filter out sensitive information
    const publicEventData = {
      id: eventSnapshot.id,
      name: eventData.name,
      date: eventData.date,
      time: eventData.time || null,
      location: eventData.location,
      venue: eventData.venue || null,
      description: eventData.description || null,
      hostName: eventData.hostName || null,
      imageUrl: eventData.imageUrl || null,
      dressCode: eventData.dressCode || null,
      instructions: eventData.instructions || null,
    };
    
    return NextResponse.json(publicEventData);
  } catch (error) {
    console.error("Error fetching public event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
} 