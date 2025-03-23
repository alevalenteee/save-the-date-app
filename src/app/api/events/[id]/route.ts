import { db } from "@/lib/firebase";
import { Event, eventConverter } from "@/lib/models";
import { doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to get mock data
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

    // Check if this is an admin request (with token)
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    
    // If token matches admin token, return full event details
    if (token === event.adminToken) {
      return NextResponse.json(event);
    }
    
    // Otherwise return public event details only
    return NextResponse.json({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      location: event.location,
      imageUrl: event.imageUrl,
      dressCode: event.dressCode,
      instructions: event.instructions,
      hostName: event.hostName,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
} 