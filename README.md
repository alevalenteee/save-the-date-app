# **S*a*ve the D*a*te** - Modern RSVP Web Application

A modern, sleek, and frictionless RSVP application for events such as weddings, birthdays, and celebrations. Built with Next.js, React, Tailwind CSS, and other modern web technologies.

## ✨ Features

### For Event Hosts

- **Instant Event Creation:** Create events in minutes with customizable details
- **Secure Admin Dashboard:** Manage events via a unique admin link
- **Guest Management:** Add guests individually or via CSV upload
- **Digital Invitations:** Generate QR codes and digital Save-the-Date cards
- **Real-time RSVP Tracking:** View and manage guest responses
- **Export Functionality:** Download guest lists and responses

### For Guests

- **One-click RSVP:** No account creation or login required
- **Mobile-friendly:** Perfect for responding on any device
- **Easy Updates:** Update RSVP status at any time

## 🔧 Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS, Shadcn/ui components
- **Animation:** Framer Motion
- **State Management:** Zustand
- **Data Fetching:** React Query
- **Form Handling:** React Hook Form with Zod validation
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (optional)
- **Storage:** Firebase Storage (for images)
- **QR Code Generation:** qrcode.react

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Firebase project

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/save-the-date-app.git
cd save-the-date-app
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up your environment variables by creating a `.env` file in the root of the project:

```
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

4. Start the development server

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3000

## 📱 Application Structure

- `/app`: Next.js app directory with pages and API routes
- `/components`: Reusable React components
- `/lib`: Utility functions and shared code
- `/lib/firebase.ts`: Firebase configuration and initialization

## 📦 Key Components

- **Event Creation Form**: Multi-step form for hosts to create new events
- **Admin Dashboard**: Interface for event management and guest tracking
- **RSVP Form**: Simple interface for guests to respond to invitations
- **QR Code Generator**: Creates scannable QR codes for invitations

## 🔒 Security

- Cryptographic tokens for admin access
- Secure invitation links for guests
- Firebase security rules for data protection
- No passwords stored for guest access

## 📃 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/)
- [Framer Motion](https://www.framer.com/motion/)
