import fs from 'fs';
import path from 'path';
import { Event, Guest, eventConverter, guestConverter } from './models';

// Mock database paths
const EVENT_DATA_PATH = path.join(process.cwd(), 'mock/data/events.json');
const GUEST_DATA_PATH = path.join(process.cwd(), 'mock/data/guests.json');

// Helper functions to read/write mock data
const readMockData = <T>(filePath: string): T[] => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading mock data from ${filePath}:`, error);
    return [];
  }
};

const writeMockData = <T>(filePath: string, data: T[]): void => {
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing mock data to ${filePath}:`, error);
  }
};

// Mock Firestore collection operations
export const getEvents = (): Event[] => {
  const events = readMockData<any>(EVENT_DATA_PATH);
  return events.map(event => ({
    ...event,
    date: new Date(event.date),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt)
  }));
};

export const getEventById = (id: string): Event | null => {
  const events = getEvents();
  const event = events.find(event => event.id === id);
  return event || null;
};

export const createEvent = (eventData: Omit<Event, 'id'>): { id: string } => {
  const events = getEvents();
  const newId = `evt${Date.now().toString().slice(-6)}`;
  const newEvent = {
    ...eventData,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  events.push(newEvent);
  writeMockData(EVENT_DATA_PATH, events);
  
  return { id: newId };
};

export const getGuests = (eventId?: string): Guest[] => {
  const guests = readMockData<any>(GUEST_DATA_PATH);
  const processedGuests = guests.map(guest => ({
    ...guest,
    createdAt: new Date(guest.createdAt),
    updatedAt: new Date(guest.updatedAt)
  }));
  
  if (eventId) {
    return processedGuests.filter(guest => guest.eventId === eventId);
  }
  
  return processedGuests;
};

export const getGuestById = (id: string): Guest | null => {
  const guests = getGuests();
  const guest = guests.find(guest => guest.id === id);
  return guest || null;
};

export const getGuestByEmail = (eventId: string, email: string): Guest | null => {
  const guests = getGuests(eventId);
  const guest = guests.find(guest => guest.email === email);
  return guest || null;
};

export const createGuest = (guestData: Omit<Guest, 'id'>): { id: string } => {
  const guests = getGuests();
  const newId = `guest${Date.now().toString().slice(-6)}`;
  const newGuest = {
    ...guestData,
    id: newId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  guests.push(newGuest);
  writeMockData(GUEST_DATA_PATH, guests);
  
  return { id: newId };
};

// Mock Firebase auth
export const simulateAuth = {
  signIn: (email: string, password: string) => {
    // In test mode, accept any credentials with valid format
    if (email && password && email.includes('@') && password.length >= 6) {
      return {
        user: {
          uid: 'test-user-id',
          email,
          displayName: email.split('@')[0]
        }
      };
    }
    throw new Error('Invalid credentials');
  }
};

// Export a mock db object to replace the Firebase db
export const mockDb = {
  collection: (collectionName: string) => {
    return {
      withConverter: () => ({
        // Mock document operations
        doc: (id: string) => ({
          get: async () => {
            if (collectionName === 'events') {
              const event = getEventById(id);
              return {
                exists: !!event,
                data: () => event,
                id
              };
            } else if (collectionName === 'guests') {
              const guest = getGuestById(id);
              return {
                exists: !!guest,
                data: () => guest,
                id
              };
            }
            return { exists: false, data: () => null, id };
          },
          set: async (data: any) => {
            if (collectionName === 'events') {
              const events = getEvents();
              const eventIndex = events.findIndex(e => e.id === id);
              if (eventIndex >= 0) {
                events[eventIndex] = { ...events[eventIndex], ...data, updatedAt: new Date() };
                writeMockData(EVENT_DATA_PATH, events);
              }
            } else if (collectionName === 'guests') {
              const guests = getGuests();
              const guestIndex = guests.findIndex(g => g.id === id);
              if (guestIndex >= 0) {
                guests[guestIndex] = { ...guests[guestIndex], ...data, updatedAt: new Date() };
                writeMockData(GUEST_DATA_PATH, guests);
              }
            }
          }
        }),
        // Mock collection operations
        add: async (data: any) => {
          if (collectionName === 'events') {
            const { id } = createEvent(data);
            return { id };
          } else if (collectionName === 'guests') {
            const { id } = createGuest(data);
            return { id };
          }
          return { id: 'mock-id' };
        },
        where: () => ({
          where: () => ({
            get: async () => {
              if (collectionName === 'guests') {
                const guests = getGuests();
                return {
                  empty: guests.length === 0,
                  docs: guests.map(guest => ({
                    id: guest.id,
                    data: () => guest,
                    exists: true
                  }))
                };
              }
              return { empty: true, docs: [] };
            }
          })
        })
      })
    };
  }
};

// Use these exports to replace the Firebase imports in the application
export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: simulateAuth.signIn
};

export const mockStorage = {
  // Mock storage operations
  ref: (path: string) => ({
    put: async (file: any) => ({
      ref: {
        getDownloadURL: async () => `https://mockcdn.example.com/${path}/${file.name}`
      }
    })
  })
}; 