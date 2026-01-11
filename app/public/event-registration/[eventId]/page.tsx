"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactSelect from "react-select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Plane,
  FileText,
  ArrowUp,
  Download,
  FileCheck,
  ExternalLink,
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_deadline?: string;
  tenant_slug?: string;
}

interface FormField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  order_index: number;
  section: string | null;
  field_options: string[] | null;
}

interface FormData {
  [key: string]: any;
}

export default function PublicEventRegistrationPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canRegister, setCanRegister] = useState(true);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [showTravelSection, setShowTravelSection] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeOfConduct, setCodeOfConduct] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        console.log('🔵 ============ FETCHING PUBLIC EVENT DATA ============');
        console.log('🔵 Event ID:', eventId);
        console.log('🔵 API URL:', process.env.NEXT_PUBLIC_API_URL);

        const [eventRes, fieldsRes, registrationRes, countriesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/public`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-registration/events/${eventId}/form-fields`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-registration/events/${eventId}/can-register`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/countries`),
        ]);

        console.log('✅ Event response status:', eventRes.status);
        console.log('✅ Fields response status:', fieldsRes.status);
        console.log('✅ Registration response status:', registrationRes.status);
        console.log('✅ Countries response status:', countriesRes.status);

        if (!eventRes.ok) {
          console.error('❌ Event not found - Status:', eventRes.status);
          setError("Event not found");
          setLoading(false);
          return;
        }

        const eventData = await eventRes.json();
        const fieldsData = await fieldsRes.json();
        const registrationData = await registrationRes.json();
        const countriesData = countriesRes.ok ? await countriesRes.json() : { countries: [] };

        console.log('✅ Event data:', eventData);
        console.log('✅ Form fields count:', fieldsData.length);
        console.log('✅ Form fields:', fieldsData);
        console.log('✅ Can register:', registrationData.can_register);

        // Filter out unwanted fields and auto-configure field types
        const unwantedFields = [
          "travellingInternationally",
          "travellingFromCountry", 
          "accommodationType",
          "accommodationNeeds",
          "dietaryRequirements",
          "certificateName",
          "badgeName",
          "travelRequirementsConfirmation"
        ];
        
        const filteredFields = fieldsData
          .filter((field: FormField) => !unwantedFields.includes(field.field_name))
          .map((field: FormField) => {
            // Auto-configure pronouns field
            if (field.field_name === "pronouns" && field.field_type === "text") {
              return {
                ...field,
                field_type: "select",
                field_options: ["Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Prefer not to say"]
              };
            }
            // Auto-configure Code of Conduct field
            if (field.field_name === "codeOfConductConfirm" && field.field_type === "checkbox") {
              return {
                ...field,
                field_type: "select",
                field_options: ["I agree", "I do not agree"]
              };
            }
            return field;
          });

        setEvent(eventData);
        setFormFields(filteredFields);
        setCanRegister(registrationData.can_register);
        setRegistrationMessage(registrationData.reason || "");
        setCountries(countriesData.countries || []);

        const initialData: FormData = {};
        filteredFields.forEach((field: FormField) => {
          if (field.field_type === 'checkbox') {
            // For single checkbox fields, initialize as empty string
            initialData[field.field_name] = field.field_options?.length === 1 ? '' : [];
          } else {
            initialData[field.field_name] = '';
          }
        });
        setFormData(initialData);

        console.log('✅ Initial form data created with', Object.keys(initialData).length, 'fields');

        // Fetch code of conduct document
        try {
          const tenant_slug = eventData.tenant_slug || 'msf-oca';
          console.log('🔵 Fetching code of conduct for tenant:', tenant_slug);
          const codeConductRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/code-of-conduct/public/${tenant_slug}`);
          if (codeConductRes.ok) {
            const codeData = await codeConductRes.json();
            setCodeOfConduct(codeData);
            console.log('✅ Code of conduct loaded');
          } else {
            console.log('⚠️ Code of conduct not found - Status:', codeConductRes.status);
          }
        } catch (err) {
          console.log("⚠️ Code of conduct fetch error:", err);
        }

        console.log('✅ ============ PUBLIC EVENT DATA LOADED ============');
      } catch (err) {
        console.error("🔴 ============ ERROR FETCHING EVENT DATA ============");
        console.error("🔴 Error:", err);
        console.error("🔴 ============ END ERROR ============");
        toast.error('Failed to load event', {
          description: 'Unable to load event details. Please refresh the page and try again.'
        });
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEmailBlur = async (email: string) => {
    if (!email || !email.includes('@')) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-registration/events/${eventId}/participant-status?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      if (data.participant_found) {
        setShowTravelSection(data.show_travel_section);
      }
    } catch (err) {
      console.error("Error checking participant status:", err);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
    if (fieldName === 'personalEmail' || fieldName === 'email') {
      handleEmailBlur(value);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Check if deadline has passed
    const isDeadlinePassed = event?.registration_deadline && new Date() > new Date(event.registration_deadline);
    
    formFields.forEach((field) => {
      // Skip travel section if not available
      if (field.section === 'travel' && !showTravelSection) return;
      
      // Skip non-travel fields if deadline has passed
      if (isDeadlinePassed && field.section !== 'travel') return;
      
      if (field.is_required) {
        const value = formData[field.field_name];
        if (field.field_type === 'checkbox') {
          // For single checkbox fields (like codeOfConductConfirm), check if string is not empty
          if (field.field_options?.length === 1) {
            if (!value || value.toString().trim() === '') {
              newErrors[field.field_name] = `${field.field_label} is required`;
            }
          } else {
            // For multiple checkbox fields, check if array is not empty
            if (!value || value.length === 0) {
              newErrors[field.field_name] = `${field.field_label} is required`;
            }
          }
        } else {
          if (!value || value.toString().trim() === '') {
            newErrors[field.field_name] = `${field.field_label} is required`;
          }
        }
      }
      if ((field.field_type === 'email' || field.field_name.toLowerCase().includes('email')) && formData[field.field_name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.field_name])) {
          newErrors[field.field_name] = 'Please enter a valid email address';
        }
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Validation errors found:', newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      console.log('✅ No validation errors found');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 ============ FORM SUBMISSION STARTED ============');
    console.log('🔵 Form data:', formData);
    console.log('🔵 Form fields:', formFields);
    
    // Check if deadline has passed
    const isDeadlinePassed = event?.registration_deadline && new Date() > new Date(event.registration_deadline);
    
    // If deadline passed and not submitting travel section only, prevent submission
    if (isDeadlinePassed && !showTravelSection) {
      toast.error('Registration deadline has passed', {
        description: 'New registrations are no longer accepted.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Set submitting state immediately
    setSubmitting(true);
    
    // Validate form
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      setSubmitting(false);
      return;
    }
    
    console.log('✅ Form validation passed, submitting...');
    
    try {
      const email = formData.personalEmail || formData.email || formData.msfEmail || '';
      console.log('🔵 Submitting with email:', email);
      
      // Prepare request body with required fields
      const requestBody = {
        ...formData,
        eventId: parseInt(eventId),
        dailyMeals: Array.isArray(formData.dailyMeals) ? formData.dailyMeals : 
                   (formData.dailyMeals ? [formData.dailyMeals] : []) // Convert to array
      };
      
      console.log('🔵 Request body:', requestBody);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-registration/events/${eventId}/public-register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );
      
      console.log('🔵 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Registration failed:', errorData);
        throw new Error(errorData.detail || 'Registration failed');
      }
      
      console.log('✅ Registration successful!');
      toast.success('Registration submitted successfully!', {
        description: `Thank you for registering for ${event?.title}. You will receive communication once the selection committee finishes selecting event participants.`
      });
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("❌ Registration error:", err);
      toast.error('Registration failed', {
        description: err.message || 'Failed to submit registration. Please try again.'
      });
    } finally {
      setSubmitting(false);
      console.log('🔵 ============ FORM SUBMISSION ENDED ============');
    }
  };

  const groupFieldsBySection = () => {
    const sections = [
      { name: 'personal', title: 'Personal Information', icon: User },
      { name: 'contact', title: 'Contact Details', icon: Mail },
      { name: 'travel', title: 'Travel & Accommodation', icon: Plane },
      { name: 'final', title: 'Final Details', icon: FileText },
    ];
    return sections.map((section) => ({
      ...section,
      fields: formFields.filter((field) => field.section === section.name).sort((a, b) => a.order_index - b.order_index),
    })).filter((section) => section.fields.length > 0);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.field_name] || '';
    const error = errors[field.field_name];
    const commonProps = { id: `field-${field.field_name}`, className: error ? 'border-red-500' : '' };

    // Special rendering for Code of Conduct field with PDF preview
    if (field.field_name === 'codeOfConductConfirm' && codeOfConduct?.document_url) {
      return (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg bg-blue-50">
            <div className="px-4 py-3 border-b border-blue-200 bg-blue-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Code of Conduct Document
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(codeOfConduct.document_url, '_blank')}
                    className="text-blue-700 border-blue-300 hover:bg-blue-200 bg-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(codeOfConduct.document_url, '_blank')}
                    className="text-blue-700 border-blue-300 hover:bg-blue-200 bg-white"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="w-full h-[400px] border border-gray-300 rounded-lg overflow-hidden shadow-inner bg-white">
                <iframe
                  src={`${codeOfConduct.document_url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full"
                  title="Code of Conduct PDF"
                />
              </div>
              <p className="text-sm text-blue-700 mt-3">
                Please review the Code of Conduct document above before confirming.
              </p>
            </div>
          </div>
          <Select value={value} onValueChange={(val) => handleInputChange(field.field_name, val)}>
            <SelectTrigger className={`h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select to confirm..." className="text-gray-500" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
              {field.field_options?.map((option) => (
                <SelectItem 
                  key={option} 
                  value={option}
                  className="hover:bg-red-50 focus:bg-red-50 cursor-pointer rounded-md"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    switch (field.field_type) {
      case 'text':
      case 'email':
        return (
          <Input
            {...commonProps}
            type={field.field_type}
            value={value}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            onBlur={(e) => { if (field.field_type === 'email') handleEmailBlur(e.target.value); }}
            className={`h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg ${error ? 'border-red-500' : ''}`}
            placeholder={`Enter ${field.field_label.toLowerCase()}...`}
          />
        );
      case 'textarea':
        return (
          <Textarea 
            {...commonProps} 
            value={value} 
            onChange={(e) => handleInputChange(field.field_name, e.target.value)} 
            rows={4}
            className={`border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg resize-none ${error ? 'border-red-500' : ''}`}
            placeholder={`Enter ${field.field_label.toLowerCase()}...`}
          />
        );
      case 'richtext':
        return (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <RichTextEditor
              value={value}
              onChange={(content) => handleInputChange(field.field_name, content)}
              placeholder={`Enter ${field.field_label.toLowerCase()}...`}
              height={300}
            />
          </div>
        );
      case 'select':
        // Use countries API for nationality and country fields
        let selectOptions = field.field_options || [];
        if ((field.field_name === 'nationality' || field.field_name === 'countryOfWork' || field.field_name.toLowerCase().includes('country')) && countries.length > 0) {
          selectOptions = countries;
        }
        
        // Use searchable dropdown for fields with many options (e.g., countries)
        if (selectOptions && selectOptions.length > 10) {
          const options = selectOptions.map(option => ({ value: option, label: option }));
          const selectedOption = value ? { value: value, label: value } : null;
          
          return (
            <ReactSelect
              id={commonProps.id}
              value={selectedOption}
              onChange={(selected) => handleInputChange(field.field_name, selected?.value || '')}
              options={options}
              placeholder={`Select ${field.field_label.toLowerCase()}...`}
              isClearable
              isSearchable
              className={error ? 'border-red-500 rounded-lg' : ''}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: '44px',
                  borderRadius: '8px',
                  borderColor: error ? '#ef4444' : state.isFocused ? '#ef4444' : '#d1d5db',
                  '&:hover': { borderColor: error ? '#ef4444' : '#ef4444' },
                  boxShadow: state.isFocused ? '0 0 0 1px #ef4444' : 'none',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fee2e2' : 'white',
                  color: state.isSelected ? 'white' : '#1f2937',
                  '&:hover': { backgroundColor: state.isSelected ? '#dc2626' : '#fee2e2' },
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af',
                }),
              }}
            />
          );
        }
        
        // Use regular select for fields with fewer options
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(field.field_name, val)}>
            <SelectTrigger className={`h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}...`} className="text-gray-500" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
              {selectOptions?.map((option) => (
                <SelectItem 
                  key={option} 
                  value={option}
                  className="hover:bg-red-50 focus:bg-red-50 cursor-pointer rounded-md"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup value={value} onValueChange={(val) => handleInputChange(field.field_name, val)} className="space-y-3">
            {field.field_options?.map((option) => (
              <div key={option} className="flex items-center space-x-3">
                <RadioGroupItem value={option} id={`${field.field_name}-${option}`} className="border-gray-300 text-red-600" />
                <Label htmlFor={`${field.field_name}-${option}`} className="text-sm font-medium text-gray-700 cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {field.field_options?.map((option) => (
              <div key={option} className="flex items-center space-x-3">
                <Checkbox
                  id={`${field.field_name}-${option}`}
                  checked={field.field_options?.length === 1 ? value === option : checkboxValues.includes(option)}
                  onCheckedChange={(checked) => {
                    // For single checkbox fields like codeOfConductConfirm, store as string
                    if (field.field_options?.length === 1) {
                      handleInputChange(field.field_name, checked ? option : '');
                    } else {
                      // For multiple checkbox fields, store as array
                      const newValues = checked ? [...checkboxValues, option] : checkboxValues.filter((v) => v !== option);
                      handleInputChange(field.field_name, newValues);
                    }
                  }}
                  className="border-gray-300 text-red-600"
                />
                <Label htmlFor={`${field.field_name}-${option}`} className="text-sm font-medium text-gray-700 cursor-pointer">{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'date':
        return (
          <Input 
            {...commonProps} 
            type="date" 
            value={value} 
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            className={`h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg ${error ? 'border-red-500' : ''}`}
          />
        );
      default:
        return (
          <Input 
            {...commonProps} 
            value={value} 
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            className={`h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg ${error ? 'border-red-500' : ''}`}
            placeholder={`Enter ${field.field_label.toLowerCase()}...`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 text-lg">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <CardTitle className="text-center text-2xl">Event Not Found</CardTitle>
            <CardDescription className="text-center">{error || "The event you're looking for doesn't exist."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Only show "Registration Closed" if deadline passed AND user is not selected
  const isDeadlinePassedCheck = event?.registration_deadline && new Date() > new Date(event.registration_deadline);
  if (!canRegister && !(isDeadlinePassedCheck && showTravelSection)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="max-w-md border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-16 h-16 text-amber-500" />
            </div>
            <CardTitle className="text-center text-2xl">Registration Closed</CardTitle>
            <CardDescription className="text-center">{registrationMessage || "Registration is currently closed."}</CardDescription>
          </CardHeader>
          {event && (
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="max-w-md border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </div>
            <CardTitle className="text-center text-3xl text-green-600">Registration Successful!</CardTitle>
            <CardDescription className="text-center text-lg mt-4">
              Thank you for registering for <strong>{event?.title}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">You will receive communication once the selection committee finishes selecting event participants.</p>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Please check your spam folder if you don't see the email before {event?.start_date ? new Date(event.start_date).toLocaleDateString() : 'the event start date'}.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionedFields = groupFieldsBySection();
  const isDeadlinePassed = event?.registration_deadline && new Date() > new Date(event.registration_deadline);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MSF</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{event?.title}</h1>
                <p className="text-sm text-gray-600">Event Registration Form</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{new Date(event!.start_date).toLocaleDateString()} - {new Date(event!.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">{event?.location}</span>
              </div>
            </div>
          </div>
          {event?.registration_deadline && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Registration Deadline: {new Date(event.registration_deadline).toLocaleString()} (Africa/Nairobi)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isDeadlinePassed && !showTravelSection && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Registration deadline has passed. New registrations are no longer accepted.</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {sectionedFields.map(({ name, title, icon: Icon, fields }) => {
            // Completely hide travel section if not available
            if (name === 'travel' && !showTravelSection) {
              return null;
            }
            
            // Hide non-travel sections if deadline passed and user is not selected
            if (isDeadlinePassed && name !== 'travel' && !showTravelSection) {
              return null;
            }

            return (
              <div key={name} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label htmlFor={`field-${field.field_name}`} className="block text-sm font-medium text-gray-700">
                        {field.field_label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="relative">
                        {renderField(field)}
                      </div>
                      {errors[field.field_name] && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors[field.field_name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Submit Button */}
          {(!isDeadlinePassed || showTravelSection) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <Button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 text-base rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Submitting {showTravelSection ? 'Travel Information' : 'Registration'}...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit {showTravelSection ? 'Travel Information' : 'Registration'}
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                By submitting, you confirm that all information provided is accurate and complete.
              </p>
            </div>
          )}
        </form>

        {/* Floating Scroll-to-Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-300 hover:scale-110"
            size="icon"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
