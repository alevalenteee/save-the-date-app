// Firebase Firestore data models

export interface User {
  id?: string;
  name?: string;
  email: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Event {
  id?: string;
  name: string;
  description?: string;
  date: Date;
  endDate?: Date;
  location: string;
  imageUrl?: string;
  dressCode?: string;
  instructions?: string;
  hostName?: string;
  hostEmail: string;
  adminToken?: string; // Making this optional for the transition
  userId?: string; // New field to link events to users
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Guest {
  id?: string;
  eventId: string;
  name: string;
  email: string;
  response?: 'yes' | 'no';
  plusOne?: boolean;
  plusOneName?: string;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Convert Firestore timestamp to Date and handle Firestore document conversions
export const userConverter = {
  toFirestore: (user: User) => {
    return {
      name: user.name || null,
      email: user.email,
      image: user.image || null,
      createdAt: user.createdAt || new Date(),
      updatedAt: new Date(),
    };
  },
  fromFirestore: (snapshot: any, options?: any): User => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      email: data.email,
      image: data.image,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }
};

export const eventConverter = {
  toFirestore: (event: Event) => {
    return {
      name: event.name,
      description: event.description || null,
      date: event.date,
      endDate: event.endDate || null,
      location: event.location,
      imageUrl: event.imageUrl || null,
      dressCode: event.dressCode || null,
      instructions: event.instructions || null,
      hostName: event.hostName || null,
      hostEmail: event.hostEmail,
      adminToken: event.adminToken || null,
      userId: event.userId || null, // Include the user ID
      createdAt: event.createdAt || new Date(),
      updatedAt: new Date(),
    };
  },
  fromFirestore: (snapshot: any, options?: any): Event => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      description: data.description,
      date: data.date.toDate(),
      endDate: data.endDate ? data.endDate.toDate() : undefined,
      location: data.location,
      imageUrl: data.imageUrl,
      dressCode: data.dressCode,
      instructions: data.instructions,
      hostName: data.hostName,
      hostEmail: data.hostEmail,
      adminToken: data.adminToken,
      userId: data.userId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
};

export const guestConverter = {
  toFirestore: (guest: Guest) => {
    return {
      eventId: guest.eventId,
      name: guest.name,
      email: guest.email,
      response: guest.response || null,
      plusOne: guest.plusOne || false,
      plusOneName: guest.plusOneName || null,
      message: guest.message || null,
      createdAt: guest.createdAt || new Date(),
      updatedAt: new Date(),
    };
  },
  fromFirestore: (snapshot: any, options?: any): Guest => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      eventId: data.eventId,
      name: data.name,
      email: data.email,
      response: data.response,
      plusOne: data.plusOne,
      plusOneName: data.plusOneName,
      message: data.message,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
}; 