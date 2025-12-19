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
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactSelect from "react-select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, fieldsRes, registrationRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-registration/events/${eventId}/public`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/form-fields`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-registration/events/${eventId}/can-register`),
        ]);

        if (!eventRes.ok) {
          setError("Event not found");
          setLoading(false);
          return;
        }

        const eventData = await eventRes.json();
        const fieldsData = await fieldsRes.json();
        const registrationData = await registrationRes.json();

        setEvent(eventData);
        setFormFields(fieldsData);
        setCanRegister(registrationData.can_register);
        setRegistrationMessage(registrationData.reason || "");

        const initialData: FormData = {};
        fieldsData.forEach((field: FormField) => {
          initialData[field.field_name] = field.field_type === 'checkbox' ? [] : '';
        });
        setFormData(initialData);

        // Fetch code of conduct document
        try {
          const tenant_slug = eventData.tenant_slug || 'msf-oca';
          const codeConductRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/code-of-conduct/public/${tenant_slug}`);
          if (codeConductRes.ok) {
            const codeData = await codeConductRes.json();
            setCodeOfConduct(codeData);
          }
        } catch (err) {
          console.log("Code of conduct not found");
        }
      } catch (err) {
        console.error("Error fetching event data:", err);
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
    formFields.forEach((field) => {
      if (field.section === 'travel' && !showTravelSection) return;
      if (field.is_required) {
        const value = formData[field.field_name];
        if (field.field_type === 'checkbox') {
          if (!value || value.length === 0) {
            newErrors[field.field_name] = `${field.field_label} is required`;
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
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const email = formData.personalEmail || formData.email || formData.msfEmail || '';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-registration/events/${eventId}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, form_data: formData }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
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
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  Code of Conduct Document
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(codeOfConduct.document_url, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(codeOfConduct.document_url, '_blank')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px] border-2 border-gray-300 rounded-lg overflow-hidden shadow-inner bg-white">
                <iframe
                  src={`${codeOfConduct.document_url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full"
                  title="Code of Conduct PDF"
                />
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Please review the Code of Conduct document above before confirming.
              </p>
            </CardContent>
          </Card>
          <Select value={value} onValueChange={(val) => handleInputChange(field.field_name, val)}>
            <SelectTrigger {...commonProps}>
              <SelectValue placeholder="Select to confirm..." />
            </SelectTrigger>
            <SelectContent>
              {field.field_options?.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
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
          />
        );
      case 'textarea':
        return <Textarea {...commonProps} value={value} onChange={(e) => handleInputChange(field.field_name, e.target.value)} rows={4} />;
      case 'richtext':
        return (
          <RichTextEditor
            value={value}
            onChange={(content) => handleInputChange(field.field_name, content)}
            placeholder={`Enter ${field.field_label.toLowerCase()}...`}
            height={300}
          />
        );
      case 'select':
        // Use searchable dropdown for fields with many options (e.g., countries)
        if (field.field_options && field.field_options.length > 10) {
          const options = field.field_options.map(option => ({ value: option, label: option }));
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
              className={error ? 'border-red-500 rounded' : ''}
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: error ? '#ef4444' : state.isFocused ? '#dc2626' : '#d1d5db',
                  '&:hover': { borderColor: error ? '#ef4444' : '#dc2626' },
                  boxShadow: state.isFocused ? '0 0 0 1px #dc2626' : 'none',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fee2e2' : 'white',
                  color: state.isSelected ? 'white' : '#1f2937',
                  '&:hover': { backgroundColor: state.isSelected ? '#dc2626' : '#fee2e2' },
                }),
              }}
            />
          );
        }
        
        // Use regular select for fields with fewer options
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(field.field_name, val)}>
            <SelectTrigger {...commonProps}>
              <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {field.field_options?.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup value={value} onValueChange={(val) => handleInputChange(field.field_name, val)}>
            {field.field_options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.field_name}-${option}`} />
                <Label htmlFor={`${field.field_name}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.field_options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.field_name}-${option}`}
                  checked={checkboxValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked ? [...checkboxValues, option] : checkboxValues.filter((v) => v !== option);
                    handleInputChange(field.field_name, newValues);
                  }}
                />
                <Label htmlFor={`${field.field_name}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'date':
        return <Input {...commonProps} type="date" value={value} onChange={(e) => handleInputChange(field.field_name, e.target.value)} />;
      default:
        return <Input {...commonProps} value={value} onChange={(e) => handleInputChange(field.field_name, e.target.value)} />;
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

  if (!canRegister) {
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
            <p className="text-gray-600 mb-4">You will receive a confirmation email shortly with further details.</p>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Please check your spam folder if you don't see the email within a few minutes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionedFields = groupFieldsBySection();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">MSF</span>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900">{event?.title}</CardTitle>
                <p className="text-gray-600 mt-1">Event Registration Form</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>{new Date(event!.start_date).toLocaleDateString()} - {new Date(event!.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>{event?.location}</span>
              </div>
              {event?.registration_deadline && (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg text-sm text-amber-700">
                  <Clock className="w-4 h-4" />
                  <span>Deadline: {new Date(event.registration_deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {sectionedFields.map(({ name, title, icon: Icon, fields }) => {
            if (name === 'travel' && !showTravelSection) {
              return (
                <Card key={name} className="border-dashed border-2 border-gray-300 bg-gray-50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-gray-400" />
                      <CardTitle className="text-xl text-gray-500">{title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        This section will be available after you are selected for the event.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={name} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-red-600" />
                    <CardTitle className="text-2xl">{title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`field-${field.field_name}`} className="text-sm font-medium">
                        <span className="text-gray-500 text-xs mr-2">#{field.order_index}</span>
                        {field.field_label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                      {errors[field.field_name] && (
                        <p className="text-red-500 text-sm">{errors[field.field_name]}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="pt-6">
              <Button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6">
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Submitting Registration...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit Registration
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-600 mt-4">
                By submitting, you confirm that all information provided is accurate and complete.
              </p>
            </CardContent>
          </Card>
        </form>

        {/* Floating Scroll-to-Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl transition-all duration-300 hover:scale-110"
            size="icon"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
