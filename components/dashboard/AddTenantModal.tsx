"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, Search, Bold, Italic, List, Link } from "lucide-react";
import apiClient, { TenantCreateRequest } from "@/lib/api";

// Simple rich text toolbar component
const RichTextEditor = ({ value, onChange, isDark }: { value: string, onChange: (value: string) => void, isDark: boolean }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className="border rounded-md" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
      <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#f9fafb' }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertText('**', '**')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertText('*', '*')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertText('- ')}
          title="List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => insertText('[', '](url)')}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Brief description of the organization..."
        className="border-0 resize-none focus-visible:ring-0"
        rows={4}
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000'
        }}
      />
    </div>
  );
};

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTenantModal({
  open,
  onClose,
  onSuccess,
}: AddTenantModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [countries, setCountries] = React.useState<Array<{name: string, code: string}>>([]);
  const [countrySearch, setCountrySearch] = React.useState("");
  const [isLoadingCountries, setIsLoadingCountries] = React.useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TenantCreateRequest>();

  React.useEffect(() => {
    setMounted(true);
    // Load countries
    const loadCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
        const data = await response.json();
        const sortedCountries = data.map((country: any) => ({
          name: country.name.common,
          code: country.cca2
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCountries(sortedCountries);
      } catch (error) {
        console.error('Failed to load countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Auto-generate slug from name
  const nameValue = watch("name");
  React.useEffect(() => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .trim();
      setValue("slug", slug);
    }
  }, [nameValue, setValue]);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const onSubmit = async (data: TenantCreateRequest) => {
    setIsSubmitting(true);
    try {
      await apiClient.createTenant({
        ...data,
        domain: data.domain || undefined,
      });
      toast.success("Tenant created successfully");
      reset();
      onClose();
      // Call onSuccess after closing to avoid token issues during refresh
      setTimeout(() => {
        onSuccess();
      }, 100);
    } catch (error: any) {
      console.error('Create tenant error:', error);
      if (error.message.includes('credentials') || error.message.includes('token')) {
        toast.error("Session expired. Please refresh the page and try again.");
      } else {
        toast.error(error?.message || "Failed to create tenant");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[800px] max-h-[90vh] border shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-auto"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb',
          color: isDark ? '#ffffff' : '#000000'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#000000' }}>
            <Building2 className="w-5 h-5" />
            Add New Tenant
          </DialogTitle>
          <DialogDescription style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
            Create a new tenant organization. The slug will be auto-generated from the name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="Enter organization name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (Auto-generated)</Label>
              <Input
                id="slug"
                {...register("slug", { required: "Slug is required" })}
                placeholder="organization-slug"
                disabled
                className="bg-muted"
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                {...register("contact_email", { required: "Contact email is required" })}
                placeholder="contact@organization.com"
              />
              {errors.contact_email && (
                <p className="text-sm text-destructive">{errors.contact_email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email</Label>
              <Input
                id="admin_email"
                type="email"
                {...register("admin_email", { required: "Admin email is required" })}
                placeholder="admin@organization.com"
              />
              {errors.admin_email && (
                <p className="text-sm text-destructive">{errors.admin_email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (Optional)</Label>
              <Input
                id="domain"
                {...register("domain")}
                placeholder="example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country (Optional)</Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger 
                      className="w-full"
                      style={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent 
                      className="max-h-60"
                      style={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb'
                      }}
                    >
                      <div className="p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="pl-8"
                            style={{
                              backgroundColor: isDark ? '#111827' : '#f9fafb',
                              borderColor: isDark ? '#374151' : '#e5e7eb',
                              color: isDark ? '#ffffff' : '#000000'
                            }}
                          />
                        </div>
                      </div>
                      {isLoadingCountries ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          <p className="text-sm mt-2">Loading countries...</p>
                        </div>
                      ) : (
                        filteredCountries.map((country) => (
                          <SelectItem 
                            key={country.code} 
                            value={country.name}
                            style={{
                              color: isDark ? '#ffffff' : '#000000'
                            }}
                          >
                            {country.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  isDark={isDark}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Tenant
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}