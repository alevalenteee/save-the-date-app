import { db } from "@/lib/firebase";
import { Event, eventConverter } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { collection, addDoc, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.date || !body.location) {
      return NextResponse.json(
        { error: "Missing required fields: name, date, and location are required" },
        { status: 400 }
      );
    }
    
    // Create new event document
    const eventData = {
      userId,
      name: body.name,
      date: body.date,
      location: body.location,
      description: body.description || "",
      createdAt: new Date().toISOString(),
      guestCount: 0
    };
    
    const eventsRef = collection(db, "events");
    const docRef = await addDoc(eventsRef, eventData);
    
    return NextResponse.json({
      id: docRef.id,
      ...eventData
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Query events from Firestore
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error getting events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
} 