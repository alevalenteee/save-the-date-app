import { NextRequest, NextResponse } from "next/server";

// Check if we're running in test mode
const isTestMode = typeof window === 'undefined' && 
  process.env.NODE_ENV === 'development' && 
  process.env.USE_MOCK_DB === 'true';

// Mock API endpoint to help with testing
export async function GET(request: NextRequest) {
  // Only allow mock API in development with USE_MOCK_DB=true
  if (!isTestMode) {
    return NextResponse.json({ error: 'Mock API not available' }, { status: 404 });
  }

  try {
    // Dynamically import mockdb
    const { getEvents, getGuests } = await import('@/lib/mockdb');
    
    // Get the events
    const events = await getEvents();
    
    // For each event, get the guests
    const eventsWithGuests = await Promise.all(
      events.map(async (event) => {
        const guests = await getGuests(event.id);
        return {
          ...event,
          guests,
        };
      })
    );
    
    return NextResponse.json(eventsWithGuests);
  } catch (error) {
    console.error('Error loading mock data:', error);
    return NextResponse.json({ error: 'Failed to load mock data' }, { status: 500 });
  }
}

// Allow creating test data via POST
export async function POST(request: NextRequest) {
  // Only allow mock API in development with USE_MOCK_DB=true
  if (!isTestMode) {
    return NextResponse.json({ error: 'Mock API not available' }, { status: 404 });
  }

  try {
    const { type, data } = await request.json();
    
    // Dynamically import mockdb
    const mockdb = await import('@/lib/mockdb');
    
    let result;
    
    if (type === 'event') {
      result = await mockdb.createEvent(data);
    } else if (type === 'guest') {
      result = await mockdb.createGuest(data);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating mock data:', error);
    return NextResponse.json({ error: 'Failed to create mock data' }, { status: 500 });
  }
} 