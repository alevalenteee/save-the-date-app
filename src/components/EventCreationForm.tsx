"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  // Step 1: Basic Event Details
  name: z.string().min(3, "Event name must be at least 3 characters"),
  date: z.date({
    required_error: "Event date is required",
  }),
  endDate: z.date().optional(),
  location: z.string().min(3, "Location must be at least 3 characters"),
  description: z.string().optional(),
  
  // Step 2: Additional Details
  imageUrl: z.string().optional(),
  dressCode: z.string().optional(),
  instructions: z.string().optional(),
  
  // Step 3: Host Information
  hostName: z.string().min(2, "Host name must be at least 2 characters"),
  hostEmail: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export default function EventCreationForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      imageUrl: "",
      dressCode: "",
      instructions: "",
      hostName: "",
      hostEmail: "",
    },
  });

  // Pre-fill host information if user is logged in
  useEffect(() => {
    if (session?.user) {
      form.setValue("hostName", session.user.name || "");
      form.setValue("hostEmail", session.user.email || "");
    }
  }, [session, form]);

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ["name", "date", "location"] 
      : step === 2 
        ? ["imageUrl", "dressCode", "instructions"] 
        : ["hostName", "hostEmail"];
    
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // If user is not authenticated, redirect to sign in
    if (status !== "authenticated") {
      toast.error("You must be signed in to create events");
      router.push("/auth/signin?callbackUrl=/create-event");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: session?.user?.id // Include the user ID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
      
      const result = await response.json();
      
      toast.success("Event created successfully!", {
        description: "Your event has been created and linked to your account."
      });
      
      // Navigate to the dashboard instead of the event-created page
      router.push(`/dashboard`);
      
    } catch (error: any) {
      toast.error("Failed to create event", {
        description: error.message || "Please try again later."
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants for the form steps
  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div>
      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                step >= i 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted border-muted-foreground/30"
              )}
            >
              {i}
            </div>
            <span className="text-sm mt-2 text-muted-foreground">
              {i === 1 ? "Event Details" : i === 2 ? "Additional Info" : "Host Details"}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Summer Wedding" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your event as it will appear on invitations.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Event Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : "Select date"}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St, City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="A brief description of your event" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
                
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            A featured image for your event invitation.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dressCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dress Code (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Formal, Casual, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Any special notes for guests" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
                
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="hostName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John & Jane Doe" {...field} />
                          </FormControl>
                          <FormDescription>
                            Name(s) of the host(s) as they will appear on invitations.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hostEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="host@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            We'll send the admin link to this email address.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-muted/50 rounded-lg text-sm">
                      <p>By creating this event, you'll receive:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                        <li>A secure admin link to manage your event and track RSVPs</li>
                        <li>The ability to add guests and send invitations</li>
                        <li>Access to QR code and digital invitation generation</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                >
                  Previous
                </Button>
                
                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="relative">
                    {isSubmitting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary rounded-md">
                        <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    Create Event
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 