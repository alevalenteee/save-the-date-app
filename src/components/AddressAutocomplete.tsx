"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { 
  useLoadScript, 
  Autocomplete as GoogleAutocomplete,
  Libraries
} from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

// Define libraries array outside component to maintain stable reference
const libraries: Libraries = ["places"];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  className,
  id
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Load the Google Maps script with stable libraries reference
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries // Use constant reference instead of inline array
  });
  
  // Detect user's country
  useEffect(() => {
    const detectCountryFromIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code) {
          setUserCountry(data.country_code.toLowerCase());
          console.log("Detected user country:", data.country_code.toLowerCase());
        }
      } catch (error) {
        console.error('Error detecting country from IP:', error);
        // Fallback to Australia if detection fails
        setUserCountry('au');
      }
    };
    
    detectCountryFromIP();
  }, []);
  
  // Update internal state when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Handle place selection
  const onPlaceSelected = () => {
    if (!autocompleteRef.current) return;
    
    const place = autocompleteRef.current.getPlace();
    
    if (place?.formatted_address) {
      setInputValue(place.formatted_address);
      onChange(place.formatted_address);
    }
  };
  
  // Handle input change to update the value locally
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  // When blurring, ensure the parent is updated with the latest value
  const handleBlur = () => {
    onChange(inputValue);
  };
  
  if (loadError) {
    console.error("Error loading Google Maps", loadError);
    // Fallback to regular input if Maps fails to load
    return (
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={className}
        id={id}
      />
    );
  }
  
  return (
    <div className="relative">
      {!isLoaded ? (
        <div className="flex items-center">
          <Input
            type="text"
            value={inputValue}
            disabled
            placeholder="Loading..."
            className={className}
            id={id}
          />
          <Loader2 className="w-4 h-4 animate-spin absolute right-3" />
        </div>
      ) : (
        <GoogleAutocomplete
          onLoad={(autocomplete) => {
            autocompleteRef.current = autocomplete;
          }}
          onPlaceChanged={onPlaceSelected}
          options={{
            types: ["address"],
            ...(userCountry ? { componentRestrictions: { country: userCountry } } : {})
          }}
        >
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
            id={id}
          />
        </GoogleAutocomplete>
      )}
    </div>
  );
} 