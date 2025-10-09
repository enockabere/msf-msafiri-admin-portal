"use client";

import { useState, useEffect, useCallback } from "react";
import Select from "react-select";

interface LocationOption {
  value: string;
  label: string;
  placeId: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSelectProps {
  value: string;
  country?: string;
  onChange: (value: string, placeDetails?: Record<string, unknown>) => void;
  placeholder?: string;
}

// Global flag to prevent multiple script loads
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;

export function LocationSelect({
  value,
  country,
  onChange,
  placeholder = "Search location",
}: LocationSelectProps) {
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(isGoogleMapsLoaded);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (isGoogleMapsLoaded || (window.google && window.google.maps)) {
        isGoogleMapsLoaded = true;
        setIsLoaded(true);
        return;
      }

      if (isGoogleMapsLoading) {
        const checkLoaded = setInterval(() => {
          if (isGoogleMapsLoaded || (window.google && window.google.maps)) {
            isGoogleMapsLoaded = true;
            setIsLoaded(true);
            clearInterval(checkLoaded);
          }
        }, 100);
        return;
      }

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
    if (isLoaded && window.google && window.google.maps) {
      const service = new google.maps.places.AutocompleteService();
      const placesServiceInstance = new google.maps.places.PlacesService(document.createElement('div'));
      setAutocompleteService(service);
      setPlacesService(placesServiceInstance);
    }
  }, [isLoaded]);

  const getCountryCode = (countryName: string): string | null => {
    const countryMap: { [key: string]: string } = {
      "United States": "us", "United Kingdom": "gb", "Canada": "ca", "Australia": "au",
      "Germany": "de", "France": "fr", "Italy": "it", "Spain": "es", "Netherlands": "nl",
      "Belgium": "be", "Switzerland": "ch", "Austria": "at", "Sweden": "se", "Norway": "no",
      "Denmark": "dk", "Finland": "fi", "Poland": "pl", "Czech Republic": "cz",
      "Hungary": "hu", "Portugal": "pt", "Greece": "gr", "Turkey": "tr", "Russia": "ru",
      "China": "cn", "Japan": "jp", "South Korea": "kr", "India": "in", "Brazil": "br",
      "Mexico": "mx", "Argentina": "ar", "Chile": "cl", "Colombia": "co", "Peru": "pe",
      "South Africa": "za", "Egypt": "eg", "Nigeria": "ng", "Kenya": "ke", "Morocco": "ma",
      "Tunisia": "tn", "Algeria": "dz", "Ghana": "gh", "Ethiopia": "et", "Uganda": "ug",
      "Tanzania": "tz", "Rwanda": "rw", "Senegal": "sn", "Mali": "ml", "Burkina Faso": "bf",
      "Niger": "ne", "Chad": "td", "Cameroon": "cm", "Central African Republic": "cf",
      "Democratic Republic of the Congo": "cd", "Republic of the Congo": "cg",
      "Gabon": "ga", "Angola": "ao", "Zambia": "zm", "Zimbabwe": "zw", "Botswana": "bw",
      "Namibia": "na", "Mozambique": "mz", "Madagascar": "mg", "Afghanistan": "af",
      "Pakistan": "pk", "Bangladesh": "bd", "Sri Lanka": "lk", "Nepal": "np",
      "Myanmar": "mm", "Thailand": "th", "Vietnam": "vn", "Cambodia": "kh", "Laos": "la",
      "Malaysia": "my", "Singapore": "sg", "Indonesia": "id", "Philippines": "ph",
      "New Zealand": "nz"
    };
    return countryMap[countryName] || null;
  };

  const searchLocations = useCallback(
    (inputValue: string) => {
      if (!autocompleteService || !inputValue.trim()) {
        setOptions([]);
        return;
      }

      setLoading(true);

      const request: Record<string, unknown> = {
        input: inputValue,
        types: ["establishment", "geocode"],
      };

      if (country) {
        const countryCode = getCountryCode(country);
        if (countryCode) {
          request.componentRestrictions = { country: countryCode };
        }
      }

      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const locationOptions = predictions.map((prediction) => ({
            value: prediction.description,
            label: prediction.description,
            placeId: prediction.place_id,
          }));
          setOptions(locationOptions);
        } else {
          setOptions([]);
        }
      });
    },
    [autocompleteService, country]
  );

  const handleChange = (selectedOption: LocationOption | null) => {
    if (!selectedOption || !placesService) {
      onChange("");
      return;
    }

    // Get place details for coordinates
    placesService.getDetails(
      {
        placeId: selectedOption.placeId,
        fields: ["geometry", "formatted_address", "name"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const placeDetails = {
            geometry: {
              location: {
                lat: () => place.geometry?.location?.lat(),
                lng: () => place.geometry?.location?.lng(),
              },
            },
            formatted_address: place.formatted_address,
            name: place.name,
          };
          onChange(selectedOption.value, placeDetails);
        } else {
          onChange(selectedOption.value);
        }
      }
    );
  };

  const selectedOption = value ? { value, label: value, placeId: "" } : null;

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      onInputChange={searchLocations}
      options={options}
      placeholder={placeholder}
      isSearchable
      isLoading={loading}
      isClearable
      className="react-select-container"
      classNamePrefix="react-select"
      noOptionsMessage={({ inputValue }) =>
        !isLoaded
          ? "Loading Google Maps..."
          : inputValue
          ? "No locations found"
          : "Type to search locations"
      }
      styles={{
        control: (base) => ({
          ...base,
          minHeight: '40px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          '&:hover': {
            border: '1px solid #d1d5db',
          },
          '&:focus-within': {
            border: '2px solid #3b82f6',
            boxShadow: '0 0 0 1px #3b82f6',
          },
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected ? '#f3f4f6' : state.isFocused ? '#f9fafb' : 'white',
          color: '#111827',
          '&:hover': {
            backgroundColor: '#f3f4f6',
          },
        }),
      }}
    />
  );
}