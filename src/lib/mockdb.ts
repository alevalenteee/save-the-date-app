import { Event, Guest } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage
let events: Event[] = [];
let guests: Guest[] = [];

// Helper functions for localStorage in browser
const getStoredEvents = (): Event[] => {
  if (typeof window !== 'undefined') {
    try {
      const storedEvents = localStorage.getItem('mockEvents');
      return storedEvents ? JSON.parse(storedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date),
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      })) : [];
    } catch (error) {
      console.error('Error reading events from localStorage:', error);
      return [];
    }
  }
  return events;
};

const storeEvents = (data: Event[]): void => {
  events = data;
  if (typeof window !== 'undefined') {
    try {
      // Convert Date objects to strings for storage
      const storableEvents = data.map(event => ({
        ...event,
        date: event.date.toISOString(),
        endDate: event.endDate ? event.endDate.toISOString() : undefined,
        createdAt: event.createdAt ? event.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: event.updatedAt ? event.updatedAt.toISOString() : new Date().toISOString()
      }));
      localStorage.setItem('mockEvents', JSON.stringify(storableEvents));
    } catch (error) {
      console.error('Error storing events in localStorage:', error);
    }
  }
};

const getStoredGuests = (): Guest[] => {
  if (typeof window !== 'undefined') {
    try {
      const storedGuests = localStorage.getItem('mockGuests');
      return storedGuests ? JSON.parse(storedGuests).map((guest: any) => ({
        ...guest,
        createdAt: new Date(guest.createdAt),
        updatedAt: new Date(guest.updatedAt)
      })) : [];
    } catch (error) {
      console.error('Error reading guests from localStorage:', error);
      return [];
    }
  }
  return guests;
};

const storeGuests = (data: Guest[]): void => {
  guests = data;
  if (typeof window !== 'undefined') {
    try {
      // Convert Date objects to strings for storage
      const storableGuests = data.map(guest => ({
        ...guest,
        createdAt: guest.createdAt ? guest.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: guest.updatedAt ? guest.updatedAt.toISOString() : new Date().toISOString()
      }));
      localStorage.setItem('mockGuests', JSON.stringify(storableGuests));
    } catch (error) {
      console.error('Error storing guests in localStorage:', error);
    }
  }
};

// Initialize with some events if needed (useful for development)
export const initMockDb = () => {
  const currentEvents = getStoredEvents();
  const currentGuests = getStoredGuests();
  
  // Only initialize if empty
  if (currentEvents.length === 0) {
    const sampleEvents: Event[] = [
      {
        id: 'event-1',
        name: 'Wedding',
        description: 'Our special day',
        date: new Date(),
        location: 'Grand Hotel',
        userId: 'user-1',
        imageUrl: 'https://example.com/image.jpg',
        hostEmail: 'host@example.com',
        adminToken: 'token-123',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    storeEvents(sampleEvents);
  }
  
  if (currentGuests.length === 0) {
    const sampleGuests: Guest[] = [
      {
        id: 'guest-1',
        eventId: 'event-1',
        name: 'John Doe',
        email: 'john@example.com',
        response: 'yes',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    storeGuests(sampleGuests);
  }
};

// Mock Firestore collection operations
export const getEvents = async (): Promise<Event[]> => {
  return getStoredEvents();
};

export const getEventById = async (id: string): Promise<Event | null> => {
  const allEvents = getStoredEvents();
  return allEvents.find(event => event.id === id) || null;
};

export const createEvent = async (eventData: Partial<Event>): Promise<{ id: string }> => {
  const id = eventData.id || uuidv4();
  const now = new Date();
  
  const newEvent: Event = {
    id,
    name: eventData.name || 'Untitled Event',
    description: eventData.description || '',
    date: eventData.date || now,
    location: eventData.location || '',
    userId: eventData.userId || 'user-1',
    imageUrl: eventData.imageUrl || '',
    hostEmail: eventData.hostEmail || 'host@example.com',
    adminToken: eventData.adminToken || uuidv4(),
    createdAt: now,
    updatedAt: now
  };
  
  const currentEvents = getStoredEvents();
  storeEvents([...currentEvents, newEvent]);
  
  return { id };
};

export const getGuests = async (eventId?: string): Promise<Guest[]> => {
  const allGuests = getStoredGuests();
  return eventId 
    ? allGuests.filter(guest => guest.eventId === eventId)
    : allGuests;
};

export const createGuest = async (guestData: Partial<Guest>): Promise<{ id: string }> => {
  if (!guestData.eventId) {
    throw new Error('eventId is required for creating a guest');
  }
  
  const id = guestData.id || uuidv4();
  const now = new Date();
  
  const newGuest: Guest = {
    id,
    eventId: guestData.eventId,
    name: guestData.name || 'Guest',
    email: guestData.email || '',
    response: guestData.response || undefined,
    createdAt: now,
    updatedAt: now
  };
  
  const currentGuests = getStoredGuests();
  storeGuests([...currentGuests, newGuest]);
  
  return { id };
};

// Mock Auth for testing
export const mockAuth = {
  signInWithEmailAndPassword: async (email: string, password: string) => {
    // Simulate successful login
    return {
      user: {
        uid: 'user-1',
        email,
        displayName: 'Test User'
      }
    };
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    // Simulate successful registration
    return {
      user: {
        uid: 'user-1',
        email,
        displayName: 'Test User'
      }
    };
  },
  onAuthStateChanged: (callback: any) => {
    // Simulate auth state
    callback({
      uid: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    });
    
    // Return unsubscribe function
    return () => {};
  }
};

// Mock Storage for testing
export const mockStorage = {
  ref: (path: string) => ({
    put: async (file: any) => {
      return {
        ref: {
          getDownloadURL: async () => `https://example.com/mock-images/${path}`
        }
      };
    },
    getDownloadURL: async () => `https://example.com/mock-images/${path}`
  })
};

// Export mockDb for Firestore replacement
export const mockDb = {
  collection: (collectionName: string) => ({
    doc: (docId: string) => ({
      get: async () => {
        if (collectionName === 'events') {
          const event = getStoredEvents().find(e => e.id === docId);
          return {
            exists: !!event,
            data: () => event
          };
        } else if (collectionName === 'guests') {
          const guest = getStoredGuests().find(g => g.id === docId);
          return {
            exists: !!guest,
            data: () => guest
          };
        }
        return { exists: false, data: () => null };
      },
      set: async (data: any) => {
        if (collectionName === 'events') {
          const currentEvents = getStoredEvents();
          const eventIndex = currentEvents.findIndex(e => e.id === docId);
          
          if (eventIndex >= 0) {
            currentEvents[eventIndex] = { ...currentEvents[eventIndex], ...data };
          } else {
            currentEvents.push({ id: docId, ...data });
          }
          
          storeEvents(currentEvents);
        } else if (collectionName === 'guests') {
          const currentGuests = getStoredGuests();
          const guestIndex = currentGuests.findIndex(g => g.id === docId);
          
          if (guestIndex >= 0) {
            currentGuests[guestIndex] = { ...currentGuests[guestIndex], ...data };
          } else {
            currentGuests.push({ id: docId, ...data });
          }
          
          storeGuests(currentGuests);
        }
      }
    }),
    where: (field: string, operator: string, value: any) => ({
      get: async () => {
        if (collectionName === 'events') {
          const filteredEvents = getStoredEvents().filter(event => {
            if (operator === '==') {
              return event[field as keyof Event] === value;
            }
            return false;
          });
          
          return {
            empty: filteredEvents.length === 0,
            docs: filteredEvents.map(event => ({
              id: event.id,
              data: () => event
            }))
          };
        } else if (collectionName === 'guests') {
          const filteredGuests = getStoredGuests().filter(guest => {
            if (operator === '==') {
              return guest[field as keyof Guest] === value;
            }
            return false;
          });
          
          return {
            empty: filteredGuests.length === 0,
            docs: filteredGuests.map(guest => ({
              id: guest.id,
              data: () => guest
            }))
          };
        }
        
        return { empty: true, docs: [] };
      }
    }),
    add: async (data: any) => {
      const id = uuidv4();
      
      if (collectionName === 'events') {
        const newEvent = { id, ...data };
        const currentEvents = getStoredEvents();
        storeEvents([...currentEvents, newEvent]);
        return { id };
      } else if (collectionName === 'guests') {
        const newGuest = { id, ...data };
        const currentGuests = getStoredGuests();
        storeGuests([...currentGuests, newGuest]);
        return { id };
      }
      
      return { id };
    }
  })
};

// Initialize the mock database
if (typeof window !== 'undefined') {
  initMockDb();
} 