"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut({ redirect: false });
        toast.success("Signed out successfully");
        router.push("/");
      } catch (error) {
        console.error("Sign out error:", error);
        toast.error("There was a problem signing out");
        router.push("/");
      }
    };

    performSignOut();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Signing out...</h1>
        <p className="text-muted-foreground">Please wait while we sign you out.</p>
      </div>
    </div>
  );
} 