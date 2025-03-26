import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; guestId: string } }
) {
  try {
    const eventId = params.id;
    const guestId = params.guestId;
    
    if (!eventId || !guestId) {
      return NextResponse.json(
        { error: "Event ID and Guest ID are required" },
        { status: 400 }
      );
    }
    
    // Get user session
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if event exists and belongs to user
    const eventRef = doc(db, "events", eventId);
    const eventSnapshot = await getDoc(eventRef);
    
    if (!eventSnapshot.exists()) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    const eventData = eventSnapshot.data();
    
    // Make sure the user is authorized to modify this event
    if (eventData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to modify this event" },
        { status: 403 }
      );
    }
    
    // Get the guest to be deleted
    const guestRef = doc(db, "guests", guestId);
    const guestSnapshot = await getDoc(guestRef);
    
    if (!guestSnapshot.exists()) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }
    
    const guestData = guestSnapshot.data();
    
    // If guest was attending, update the event's guest count
    if (guestData.response === "attending") {
      const currentGuestCount = eventData.guestCount || 0;
      const decreaseAmount = guestData.numberOfGuests || 1;
      const newGuestCount = Math.max(0, currentGuestCount - decreaseAmount);
      
      // Update the event document with the new guest count
      await updateDoc(eventRef, {
        guestCount: newGuestCount
      });
    }
    
    // Delete the guest
    await deleteDoc(guestRef);
    
    return NextResponse.json(
      { success: true, message: "Guest deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting guest:", error);
    return NextResponse.json(
      { error: "Failed to delete guest" },
      { status: 500 }
    );
  }
} 