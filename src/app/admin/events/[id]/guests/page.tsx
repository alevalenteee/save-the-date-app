"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ArrowLeft, Check, Download, RefreshCcw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface GuestResponse {
  id: string;
  name: string;
  email: string;
  response: 'yes' | 'no';
  plusOne: boolean;
  plusOneName?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export default function GuestsList() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [guests, setGuests] = useState<GuestResponse[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Admin token is required');
      setLoading(false);
      return;
    }
    
    fetchGuests();
  }, [eventId, token]);

  const fetchGuests = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/guests?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch guest list');
      }
      
      const data = await response.json();
      setGuests(data);
      setFilteredGuests(data);
    } catch (err) {
      console.error('Error fetching guests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load guest data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase();
      const filtered = guests.filter(
        guest => 
          guest.name.toLowerCase().includes(lowerQuery) ||
          guest.email.toLowerCase().includes(lowerQuery)
      );
      setFilteredGuests(filtered);
    } else {
      setFilteredGuests(guests);
    }
  }, [searchTerm, guests]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/guests?token=${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refresh guest data");
      }
      
      const data = await response.json();
      setGuests(data);
      setFilteredGuests(data);
      toast({
        title: "Refreshed",
        description: "Guest list has been updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Response", "Plus One", "Plus One Name", "Message", "Responded At"];
    const rows = guests.map(guest => [
      guest.name,
      guest.email,
      guest.response,
      guest.plusOne ? "Yes" : "No",
      guest.plusOneName || "",
      guest.message || "",
      new Date(guest.createdAt).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && (cell.includes(",") || cell.includes("\n") || cell.includes('"'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `guests-${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading guest list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push(`/admin/events/${eventId}?token=${token}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Guest List</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Guests</CardTitle>
              <CardDescription>
                Manage your event attendees
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search guests..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGuests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Plus One</TableHead>
                    <TableHead>Responded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">{guest.name}</TableCell>
                      <TableCell>{guest.email}</TableCell>
                      <TableCell>
                        <ResponseBadge response={guest.response} />
                      </TableCell>
                      <TableCell>
                        {guest.plusOne ? (
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            {guest.plusOneName && <span className="text-sm text-muted-foreground ml-1">({guest.plusOneName})</span>}
                          </div>
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(guest.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground mb-2">No guests found</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Try a different search term" : "Share your event to start collecting RSVPs"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResponseBadge({ response }: { response: string }) {
  switch (response) {
    case 'yes':
      return <Badge className="bg-green-500">Attending</Badge>;
    case 'no':
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Not Attending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
} 