import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/events - Start");
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log("POST /api/events - Unauthorized (no session)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("POST /api/events - User ID:", userId);
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.date || !body.location) {
      console.log("POST /api/events - Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: name, date, and location are required" },
        { status: 400 }
      );
    }
    
    // Check if user exists in Firestore
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    // Create user if doesn't exist
    if (!userSnap.exists()) {
      console.log("POST /api/events - Creating new user:", userId);
      await setDoc(userRef, {
        name: session.user.name || undefined,
        email: session.user.email!,
        image: session.user.image || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Create new event document
    const eventData = {
      userId,
      name: body.name,
      date: body.date,
      time: body.time || "",
      location: body.location,
      venue: body.venue || "",
      description: body.description || "",
      imageUrl: body.imageUrl || "",
      dressCode: body.dressCode || "",
      instructions: body.instructions || "",
      hostName: body.hostName || "",
      hostEmail: body.hostEmail || "",
      createdAt: new Date().toISOString(),
      guestCount: 0
    };
    
    const eventsRef = collection(db, "events");
    const docRef = await addDoc(eventsRef, eventData);
    console.log("POST /api/events - Event created:", docRef.id);
    
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
    console.log("GET /api/events - Start");
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log("GET /api/events - Unauthorized (no session)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("GET /api/events - User ID:", userId);
    
    // Check if user exists in Firestore
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    // Create user if doesn't exist
    if (!userSnap.exists()) {
      console.log("GET /api/events - Creating new user:", userId);
      await setDoc(userRef, {
        name: session.user.name || undefined,
        email: session.user.email!,
        image: session.user.image || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Query events from Firestore
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`GET /api/events - Found ${events.length} events`);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error getting events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
} 