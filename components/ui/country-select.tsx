"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  flag: string;
}

interface CountryOption {
  value: string;
  label: string;
  flag: string;
}

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select country",
}: CountrySelectProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_COUNTRIES_API_URL}?fields=name,cca2,flag`
        );
        const data: Country[] = await response.json();

        const countryOptions = data
          .sort((a, b) => a.name.common.localeCompare(b.name.common))
          .map((country) => ({
            value: country.name.common,
            label: country.name.common,
            flag: country.flag,
          }));
        
        setCountries(countryOptions);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const selectedOption = countries.find(country => country.value === value);

  const formatOptionLabel = (option: CountryOption) => (
    <div className="flex items-center gap-2">
      <span>{option.flag}</span>
      <span>{option.label}</span>
    </div>
  );

  return (
    <Select
      value={selectedOption}
      onChange={(option) => {
        console.warn("Selected country:", option?.value);
        onChange(option?.value || "");
      }}
      options={countries}
      formatOptionLabel={formatOptionLabel}
      placeholder={placeholder}
      isSearchable
      isLoading={loading}
      className="react-select-container"
      classNamePrefix="react-select"
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
