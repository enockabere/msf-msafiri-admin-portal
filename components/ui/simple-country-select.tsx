"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface Country {
  name: {
    common: string;
  };
  cca2: string;
  flag: string;
}

interface SimpleCountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SimpleCountrySelect({
  value,
  onChange,
  placeholder = "Select country",
}: SimpleCountrySelectProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_COUNTRIES_API_URL}?fields=name,cca2,flag`);
        const data = await response.json();
        const sortedCountries = data.sort((a: Country, b: Country) => 
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sortedCountries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading countries..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {countries.map((country) => (
          <SelectItem key={country.cca2} value={country.name.common}>
            <span className="flex items-center gap-2">
              <span>{country.flag}</span>
              {country.name.common}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}