"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "./input";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: Record<string, unknown>) => void;
  placeholder?: string;
  className?: string;
  country?: string;
}

// Global flag to prevent multiple script loads
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter location",
  className,
  country,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(isGoogleMapsLoaded);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (isGoogleMapsLoaded || (window.google && window.google.maps)) {
        isGoogleMapsLoaded = true;
        setIsLoaded(true);
        return;
      }

      if (isGoogleMapsLoading) {
        // Wait for existing load to complete
        const checkLoaded = setInterval(() => {
          if (isGoogleMapsLoaded || (window.google && window.google.maps)) {
            isGoogleMapsLoaded = true;
            setIsLoaded(true);
            clearInterval(checkLoaded);
          }
        }, 100);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(`script[src*="${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_URL}"]`);
      if (existingScript) {
        isGoogleMapsLoaded = true;
        setIsLoaded(true);
        return;
      }

      isGoogleMapsLoading = true;
      const script = document.createElement("script");
      script.src = `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_URL}?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => {
        isGoogleMapsLoaded = true;
        isGoogleMapsLoading = false;
        setIsLoaded(true);
      };
      script.onerror = () => {
        isGoogleMapsLoading = false;
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      const options: Record<string, unknown> = {
        types: ["establishment", "geocode"],
        fields: ["place_id", "formatted_address", "name", "geometry", "types"],
      };
      
      // Add country restriction if country is provided
      if (country) {
        // Convert country name to ISO code for Google Maps
        const countryCode = getCountryCode(country);
        if (countryCode) {
          options.componentRestrictions = { country: countryCode };
        }
      }
      
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, options);

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          onChange(place.formatted_address, place);
        }
      });
    }
  }, [isLoaded, onChange, country]);
  
  // Update country restriction when country changes
  useEffect(() => {
    if (autocompleteRef.current && country) {
      const countryCode = getCountryCode(country);
      if (countryCode) {
        autocompleteRef.current.setComponentRestrictions({ country: countryCode });
      }
    }
  }, [country]);

  // Clear previous autocomplete when country changes
  useEffect(() => {
    if (autocompleteRef.current && country) {
      // Clear the input when country changes to get fresh suggestions
      if (inputRef.current) {
        inputRef.current.value = "";
        onChange("");
      }
    }
  }, [country, onChange]);

  // Helper function to convert country name to ISO code
  const getCountryCode = (countryName: string): string | null => {
    const countryMap: { [key: string]: string } = {
      "United States": "us",
      "United Kingdom": "gb",
      "Canada": "ca",
      "Australia": "au",
      "Germany": "de",
      "France": "fr",
      "Italy": "it",
      "Spain": "es",
      "Netherlands": "nl",
      "Belgium": "be",
      "Switzerland": "ch",
      "Austria": "at",
      "Sweden": "se",
      "Norway": "no",
      "Denmark": "dk",
      "Finland": "fi",
      "Poland": "pl",
      "Czech Republic": "cz",
      "Hungary": "hu",
      "Portugal": "pt",
      "Greece": "gr",
      "Turkey": "tr",
      "Russia": "ru",
      "China": "cn",
      "Japan": "jp",
      "South Korea": "kr",
      "India": "in",
      "Brazil": "br",
      "Mexico": "mx",
      "Argentina": "ar",
      "Chile": "cl",
      "Colombia": "co",
      "Peru": "pe",
      "South Africa": "za",
      "Egypt": "eg",
      "Nigeria": "ng",
      "Kenya": "ke",
      "Morocco": "ma",
      "Tunisia": "tn",
      "Algeria": "dz",
      "Ghana": "gh",
      "Ethiopia": "et",
      "Uganda": "ug",
      "Tanzania": "tz",
      "Rwanda": "rw",
      "Senegal": "sn",
      "Mali": "ml",
      "Burkina Faso": "bf",
      "Niger": "ne",
      "Chad": "td",
      "Cameroon": "cm",
      "Central African Republic": "cf",
      "Democratic Republic of the Congo": "cd",
      "Republic of the Congo": "cg",
      "Gabon": "ga",
      "Equatorial Guinea": "gq",
      "São Tomé and Príncipe": "st",
      "Angola": "ao",
      "Zambia": "zm",
      "Zimbabwe": "zw",
      "Botswana": "bw",
      "Namibia": "na",
      "Lesotho": "ls",
      "Eswatini": "sz",
      "Mozambique": "mz",
      "Madagascar": "mg",
      "Mauritius": "mu",
      "Seychelles": "sc",
      "Comoros": "km",
      "Djibouti": "dj",
      "Eritrea": "er",
      "Somalia": "so",
      "Sudan": "sd",
      "South Sudan": "ss",
      "Libya": "ly",
      "Afghanistan": "af",
      "Pakistan": "pk",
      "Bangladesh": "bd",
      "Sri Lanka": "lk",
      "Nepal": "np",
      "Bhutan": "bt",
      "Maldives": "mv",
      "Myanmar": "mm",
      "Thailand": "th",
      "Vietnam": "vn",
      "Cambodia": "kh",
      "Laos": "la",
      "Malaysia": "my",
      "Singapore": "sg",
      "Indonesia": "id",
      "Philippines": "ph",
      "Brunei": "bn",
      "East Timor": "tl",
      "Papua New Guinea": "pg",
      "Solomon Islands": "sb",
      "Vanuatu": "vu",
      "Fiji": "fj",
      "New Zealand": "nz",
      "Samoa": "ws",
      "Tonga": "to",
      "Tuvalu": "tv",
      "Kiribati": "ki",
      "Nauru": "nr",
      "Marshall Islands": "mh",
      "Micronesia": "fm",
      "Palau": "pw"
    };
    return countryMap[countryName] || null;
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}