"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function EventCreatedPage() {
  const searchParams = useSearchParams();
  const adminUrl = searchParams.get("adminUrl") || "";
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(adminUrl);
    setIsCopied(true);
    toast.success("Admin link copied to clipboard");
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="container mx-auto py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl font-antonio">
            <b>S<i>a</i>ve the D<i>a</i>te</b>
          </span>
        </Link>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Event Created Successfully! 🎉</CardTitle>
            <CardDescription className="text-center">
              Your event has been created and is ready to share with your guests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-6">
              <h3 className="font-medium mb-2">Your Admin Link</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Save this link to manage your event. For security, this link will only be shown once.
              </p>
              <div className="flex items-center gap-2">
                <div className="bg-background border rounded-md p-3 text-sm flex-1 overflow-x-auto">
                  {adminUrl}
                </div>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={copyToClipboard}
                  className="flex-shrink-0"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Next Steps</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Use your admin link to access your event dashboard</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Add guests to your event and customize invitation settings</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Generate QR codes and digital invitations to share with your guests</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p>Track RSVPs and manage your guest list</p>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
            {adminUrl && (
              <Button asChild>
                <Link href={adminUrl}>Go to Admin Dashboard</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SaveTheDate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 