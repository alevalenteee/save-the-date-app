import { db } from "@/lib/firebase";
import { Guest, guestConverter } from "@/lib/models";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get mock guests data
async function getMockGuests(): Promise<Guest[]> {
  try {
    const filePath = path.join(process.cwd(), 'mock', 'data', 'guests.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const guests = JSON.parse(fileContents);
    
    // Convert string dates to Date objects
    return guests.map((guest: any) => ({
      ...guest,
      createdAt: guest.createdAt ? new Date(guest.createdAt) : new Date(),
      updatedAt: guest.updatedAt ? new Date(guest.updatedAt) : new Date()
    }));
  } catch (error) {
    console.error("Error reading mock guests data:", error);
    return [];
  }
}

// Helper function to add a mock guest
async function addMockGuest(guestData: Guest): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'mock', 'data', 'guests.json');
    const guests = await getMockGuests();
    
    // Generate a new ID for the guest
    const newGuest = {
      ...guestData,
      id: `guest${guests.length + 1}` // or use uuidv4() if you prefer
    };
    
    // Add the new guest to the array
    guests.push(newGuest);
    
    // Write the updated array back to the file
    await fs.writeFile(filePath, JSON.stringify(guests, null, 2), 'utf8');
    
    return newGuest.id;
  } catch (error) {
    console.error("Error adding mock guest:", error);
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Validate required fields
    if (!id || !data.name || !data.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the guest RSVP data
    const guestData = {
      eventId: id,
      name: data.name,
      email: data.email,
      response: data.response || "yes",
      plusOne: data.plusOne || false,
      plusOneName: data.plusOneName || null,
      message: data.message || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let guestId: string;

    // Check if using mock DB
    if (process.env.USE_MOCK_DB === 'true') {
      // Check if guest has already RSVP'd in mock data
      const guests = await getMockGuests();
      const existingGuest = guests.find(
        guest => guest.eventId === id && guest.email === data.email
      );
      
      if (existingGuest) {
        return NextResponse.json(
          { error: "You have already RSVP'd to this event" },
          { status: 400 }
        );
      }
      
      // Add to mock data
      guestId = await addMockGuest(guestData);
    } else {
      // Check if guest has already RSVP'd in Firestore
      const guestsRef = collection(db, "guests");
      const q = query(
        guestsRef,
        where("eventId", "==", id),
        where("email", "==", data.email)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return NextResponse.json(
          { error: "You have already RSVP'd to this event" },
          { status: 400 }
        );
      }
      
      // Add to Firestore
      const guestRef = await addDoc(
        collection(db, "guests"),
        guestConverter.toFirestore(guestData)
      );
      
      guestId = guestRef.id;
    }

    return NextResponse.json({
      success: true,
      guestId: guestId,
      message: "RSVP submitted successfully"
    });
  } catch (error) {
    console.error("Error submitting RSVP:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    );
  }
} 