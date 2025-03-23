import { NextRequest, NextResponse } from "next/server";
import { getEvents, getGuests, createEvent, createGuest } from "@/lib/mockdb";
import fs from 'fs';
import path from 'path';

// Mock API endpoint to help with testing
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    // Check if we're in test mode
    const isTestMode = process.env.USE_MOCK_DB === 'true';
    if (!isTestMode) {
      return NextResponse.json(
        { error: "Mock API is only available in test mode" },
        { status: 403 }
      );
    }
    
    switch (action) {
      case "events":
        return NextResponse.json(getEvents());
        
      case "guests": {
        const eventId = url.searchParams.get("eventId");
        return NextResponse.json(getGuests(eventId || undefined));
      }
        
      case "reset": {
        // Reset mock data to initial state
        const mockDir = path.join(process.cwd(), 'mock/data');
        
        // Check if directory exists
        if (fs.existsSync(mockDir)) {
          // Write empty arrays to reset the data
          fs.writeFileSync(
            path.join(mockDir, 'events.json'), 
            JSON.stringify([], null, 2)
          );
          fs.writeFileSync(
            path.join(mockDir, 'guests.json'), 
            JSON.stringify([], null, 2)
          );
        }
        
        return NextResponse.json({
          success: true,
          message: "Mock data has been reset"
        });
      }
        
      default:
        return NextResponse.json({
          message: "Mock API for test mode",
          availableActions: [
            "events - Get all events",
            "guests - Get all guests (optionally filtered by eventId)",
            "reset - Reset all mock data"
          ],
          testMode: isTestMode
        });
    }
  } catch (error) {
    console.error("Error in mock API:", error);
    return NextResponse.json(
      { error: "An error occurred in the mock API" },
      { status: 500 }
    );
  }
}

// Allow creating test data via POST
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const data = await request.json();
    
    // Check if we're in test mode
    const isTestMode = process.env.USE_MOCK_DB === 'true';
    if (!isTestMode) {
      return NextResponse.json(
        { error: "Mock API is only available in test mode" },
        { status: 403 }
      );
    }
    
    switch (action) {
      case "createEvent": {
        const { id } = createEvent(data);
        return NextResponse.json({
          success: true,
          id,
          message: "Test event created"
        });
      }
        
      case "createGuest": {
        const { id } = createGuest(data);
        return NextResponse.json({
          success: true,
          id,
          message: "Test guest created"
        });
      }
        
      default:
        return NextResponse.json(
          { 
            error: "Invalid action",
            availableActions: [
              "createEvent - Create a test event",
              "createGuest - Create a test guest"
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in mock API:", error);
    return NextResponse.json(
      { error: "An error occurred in the mock API" },
      { status: 500 }
    );
  }
} 