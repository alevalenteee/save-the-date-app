import { db } from "@/lib/firebase";
import { Event, eventConverter } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate the required fields
    if (!data.name || !data.date || !data.location || !data.hostEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a unique admin token
    const adminToken = crypto.randomBytes(32).toString("hex");

    // Create the event data object
    const eventData: Event = {
      name: data.name,
      description: data.description,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      location: data.location,
      imageUrl: data.imageUrl,
      dressCode: data.dressCode,
      instructions: data.instructions,
      hostName: data.hostName,
      hostEmail: data.hostEmail,
      adminToken,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the event in Firestore
    const eventsRef = collection(db, "events");
    const eventRef = await addDoc(eventsRef, eventConverter.toFirestore(eventData));
    const eventId = eventRef.id;

    // In a real application, you would send an email to the host with the admin link
    // For now, we'll just return the admin token in the response
    
    return NextResponse.json({
      success: true,
      eventId,
      adminToken,
      adminUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/admin/events/${eventId}?token=${adminToken}`,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
} 