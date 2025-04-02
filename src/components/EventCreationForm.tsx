"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, Upload } from "lucide-react";
import { useEffect, useState, useRef } from "react";
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
import { storage } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import ImageCropper from "@/components/ImageCropper";

const formSchema = z.object({
  // Step 1: Basic Event Details
  name: z.string().min(3, "Event name must be at least 3 characters"),
  date: z.date({
    required_error: "Event date is required",
  }),
  time: z.string().min(1, "Event time is required"),
  endDate: z.date().optional(),
  location: z.string().min(3, "Location must be at least 3 characters"),
  venue: z.string().optional(),
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

interface EventCreationFormProps {
  isEditing?: boolean;
  eventData?: any;
}

export default function EventCreationForm({ isEditing = false, eventData }: EventCreationFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  // Flag to prevent unintended redirects
  const [userInitiatedAction, setUserInitiatedAction] = useState(false);
  
  // Generate time options for the select component
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourDisplay = hour % 12 === 0 ? 12 : hour % 12;
        const amPm = hour < 12 ? 'AM' : 'PM';
        const minuteDisplay = minute === 0 ? '00' : minute;
        options.push(`${hourDisplay}:${minuteDisplay} ${amPm}`);
      }
    }
    return options;
  };
  
  const timeOptions = generateTimeOptions();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      time: "",
      location: "",
      venue: "",
      description: "",
      imageUrl: "",
      dressCode: "",
      instructions: "",
      hostName: "",
      hostEmail: "",
    },
  });

  // Make sure the form captures event data when editing
  useEffect(() => {
    if (isEditing && eventData) {
      // Handle date conversion from string to Date object
      const eventDate = eventData.date ? new Date(eventData.date) : undefined;
      const eventEndDate = eventData.endDate ? new Date(eventData.endDate) : undefined;
      
      form.reset({
        name: eventData.name || "",
        date: eventDate,
        time: eventData.time || "12:00 PM",
        endDate: eventEndDate,
        location: eventData.location || "",
        venue: eventData.venue || "",
        description: eventData.description || "",
        imageUrl: eventData.imageUrl || "",
        dressCode: eventData.dressCode || "",
        instructions: eventData.instructions || "",
        hostName: eventData.hostName || "",
        hostEmail: eventData.hostEmail || "",
      });
      
      // Set image preview if there's an image URL
      if (eventData.imageUrl) {
        setImagePreview(eventData.imageUrl);
      }
    }
  }, [isEditing, eventData, form]);

  // Pre-fill host information if user is logged in and not editing
  useEffect(() => {
    if (!isEditing && session?.user) {
      form.setValue("hostName", session.user.name || "");
      form.setValue("hostEmail", session.user.email || "");
    }
  }, [session, form, isEditing]);

  const nextStep = async () => {
    // Explicitly prevent form submission
    try {
      // Only validate required fields for step 1 and 3
      // For step 2, we'll make validation optional to prevent submission attempts
      const fieldsToValidate = step === 1 
        ? ["name", "date", "time", "location"] 
        : step === 2 
          ? [] // Make step 2 validation optional - image, dressCode and instructions are optional fields
          : ["hostName", "hostEmail"];
      
      const isValid = fieldsToValidate.length > 0 
        ? await form.trigger(fieldsToValidate as any)
        : true; // Always valid for step 2 since fields are optional
      
      if (isValid) {
        setStep(prev => Math.min(prev + 1, 3));
      }
    } catch (error) {
      // Error handling
    }
  };

  const prevStep = () => {
    // Explicitly prevent any form submission side effects
    try {
      setStep(prev => Math.max(prev - 1, 1));
    } catch (error) {
      // Error handling
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.includes('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create temporary URL for cropping
    const tempImageUrl = URL.createObjectURL(file);
    setCropImageSrc(tempImageUrl);
    setShowCropper(true);
  };

  const handleCroppedImageUpload = async (croppedImageUrl: string) => {
    // Explicitly prevent form submission during cropping
    if (isSubmitting) {
      return;
    }
    
    // Set uploading state for UI feedback
    setIsUploading(true);
    
    try {
      // Convert data URL to blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();

      // Create filename with timestamp and random string to avoid collisions
      const fileName = `cropped-event-image-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
      
      // Create a reference to the storage location
      const storageRef = ref(storage, `event-images/${fileName}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Set the URL in the form
      form.setValue('imageUrl', downloadURL);
      
      // Show preview
      setImagePreview(downloadURL);
      
      toast.success('Image cropped and uploaded successfully');
      
      // Close the cropper and clean up
      setShowCropper(false);
      setCropImageSrc(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please check your Firebase configuration.');
      setShowCropper(false);
      setCropImageSrc(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropImageSrc(null);
  };

  const onSubmit = async (data: FormValues) => {
    // Safety check - only process form submission on step 3
    if (step !== 3) {
      return;
    }
    
    setUserInitiatedAction(true);
    setIsSubmitting(true);
    
    // If user is not authenticated, redirect to sign in
    if (status !== "authenticated") {
      toast.error("You must be signed in to create events");
      router.push("/auth/signin?callbackUrl=/create-event");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Combine date and time with better error handling
      const eventDate = new Date(data.date);
      
      // Set default time if no time is selected
      if (!data.time) {
        data.time = "12:00 PM";
      }
      
      try {
        // Safer parsing of time string - handle different formats
        let hours = 0;
        let minutes = 0;
        let isPM = false;
        
        // Extract time components
        const timeString = data.time;
        isPM = timeString.toLowerCase().includes('pm');
        
        // Get hours and minutes from the time string
        const timeParts = timeString.split(':');
        if (timeParts.length >= 1) {
          hours = parseInt(timeParts[0], 10);
          
          if (timeParts.length >= 2) {
            // Extract just the numeric part of minutes, ignoring AM/PM
            const minuteStr = timeParts[1].replace(/[^\d]/g, '');
            minutes = parseInt(minuteStr, 10);
          }
        }
        
        // Validate the parsed values
        if (isNaN(hours)) hours = 12;
        if (isNaN(minutes)) minutes = 0;
        
        // Apply 12-hour to 24-hour conversion
        let hour24 = hours;
        if (isPM && hours < 12) hour24 += 12;
        if (!isPM && hours === 12) hour24 = 0;
        
        // Set the time on the date object
        eventDate.setHours(hour24, minutes, 0, 0);
      } catch (timeError) {
        // If time parsing fails, default to noon on the selected date
        eventDate.setHours(12, 0, 0, 0);
      }
      
      // Determine if creating new or updating existing
      const url = isEditing ? `/api/events/${eventData.id}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: eventDate.toISOString(),
          userId: session?.user?.id // Include the user ID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} event`);
      }
      
      const result = await response.json();
      
      toast.success(`Event ${isEditing ? 'updated' : 'created'} successfully!`, {
        description: `Your event has been ${isEditing ? 'updated' : 'created'} and linked to your account.`
      });
      
      // Immediate redirection
      if (isEditing && eventData?.id) {
        // If editing, redirect back to the event details page
        router.push(`/events/${eventData.id}`);
      } else {
        // If creating new, redirect to dashboard
        router.push(`/dashboard`);
      }
      
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} event`, {
        description: error.message || "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
      setUserInitiatedAction(false);
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
                                  fromYear={new Date().getFullYear()}
                                  toYear={new Date().getFullYear() + 5}
                                />
                                {/* Add manual date input option */}
                                <div className="p-3 border-t">
                                  <FormLabel>Or type a date:</FormLabel>
                                  <Input 
                                    type="date"
                                    className="mt-1"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        field.onChange(new Date(e.target.value));
                                      }
                                    }}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Time</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time">
                                    {field.value || "Select time"}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <AddressAutocomplete
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="123 Main Street, City, State" 
                              id="location"
                            />
                          </FormControl>
                          <FormDescription>
                            The address where your event will be held.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Grand Ballroom" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of the venue (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add details about your event"
                              className="resize-none min-h-[100px]"
                              {...field}
                            />
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
                    <div className="space-y-4">
                      <FormLabel>Cover Image</FormLabel>
                      <div className="flex flex-col items-center gap-4">
                        {imagePreview ? (
                          <div className="relative w-full h-48 md:h-64 rounded-md overflow-hidden">
                            <Image 
                              src={imagePreview} 
                              alt="Event cover"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 md:h-64 bg-muted/50 rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">No cover image uploaded</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>Uploading...</>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {imagePreview ? "Change Image" : "Upload Image"}
                              </>
                            )}
                          </Button>
                          
                          {imagePreview && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setImagePreview(null);
                                form.setValue("imageUrl", "");
                              }}
                            >
                              Remove Image
                            </Button>
                          )}
                        </div>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {showCropper && cropImageSrc && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
                        <div className="w-full max-w-3xl">
                          <ImageCropper
                            imageUrl={cropImageSrc}
                            onCropComplete={handleCroppedImageUpload}
                            onCancel={handleCropCancel}
                            aspectRatio={16/9} // Good ratio for invitations
                          />
                        </div>
                      </div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="dressCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dress Code</FormLabel>
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
                          <FormLabel>Special Instructions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any special instructions for your guests"
                              className="resize-none min-h-[100px]" 
                              {...field}
                            />
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
                            Contact email for the event host.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-muted/50 rounded-lg text-sm">
                      <p>By creating this event, you'll be able to:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                        <li>Manage your event directly from your dashboard</li>
                        <li>Add guests and track RSVPs</li>
                        <li>Generate QR codes and digital invitations</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-4 pt-4 border-t">
                {step > 1 ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault(); // Explicitly prevent default
                      prevStep();
                    }}
                  >
                    Previous
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault(); // Explicitly prevent default
                      nextStep();
                    }}
                  >
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
                    {isEditing ? 'Update Event' : 'Create Event'}
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