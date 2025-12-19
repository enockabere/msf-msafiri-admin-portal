"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface FormField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: string[];
  is_required: boolean;
  order_index: number;
  section?: string;
}

interface PublicDynamicFormProps {
  eventId: number;
  participantEmail?: string;
  onSubmit: (formData: any) => void;
  submitting?: boolean;
}

export default function PublicDynamicForm({ 
  eventId, 
  participantEmail, 
  onSubmit, 
  submitting = false 
}: PublicDynamicFormProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showTravelSection, setShowTravelSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canRegister, setCanRegister] = useState(true);
  const [registrationMessage, setRegistrationMessage] = useState("");

  // Form sections for better organization
  const formSections = [
    { id: 'personal', title: 'Personal Information', order: 1 },
    { id: 'contact', title: 'Contact Details', order: 2 },
    { id: 'travel', title: 'Travel & Accommodation', order: 3 },
    { id: 'final', title: 'Final Details', order: 4 }
  ];

  useEffect(() => {
    loadFormFields();
    checkRegistrationStatus();
    if (participantEmail) {
      checkParticipantStatus();
    }
  }, [eventId, participantEmail]);

  const loadFormFields = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/form-fields`
      );
      if (response.ok) {
        const fieldsData = await response.json();
        setFields(fieldsData.sort((a: FormField, b: FormField) => a.order_index - b.order_index));
      }
    } catch (error) {
      console.error("Error loading form fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/can-register`
      );
      if (response.ok) {
        const data = await response.json();
        setCanRegister(data.can_register);
        if (!data.can_register) {
          setRegistrationMessage(data.reason);
        }
      }
    } catch (error) {
      console.error("Error checking registration status:", error);
    }
  };

  const checkParticipantStatus = async () => {
    if (!participantEmail) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/participant-status?email=${encodeURIComponent(participantEmail)}`
      );
      if (response.ok) {
        const data = await response.json();
        setShowTravelSection(data.show_travel_section);
      }
    } catch (error) {
      console.error("Error checking participant status:", error);
    }
  };

  const getFieldsBySection = (sectionId: string) => {
    return fields.filter(field => field.section === sectionId);
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const validateStep = (stepIndex: number) => {
    const section = formSections[stepIndex];
    if (!section) return true;

    // Skip travel section if participant is not selected
    if (section.id === 'travel' && !showTravelSection) {
      return true;
    }

    const sectionFields = getFieldsBySection(section.id);
    
    for (const field of sectionFields) {
      if (field.is_required && !formData[field.field_name]) {
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      // Skip travel section if not needed
      let nextStepIndex = currentStep + 1;
      if (nextStepIndex < formSections.length && 
          formSections[nextStepIndex].id === 'travel' && 
          !showTravelSection) {
        nextStepIndex++;
      }
      
      setCurrentStep(Math.min(nextStepIndex, formSections.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      sonnerToast.error("Required Fields Missing", {
        description: "Please complete all required fields before proceeding",
      });
    }
  };

  const prevStep = () => {
    // Skip travel section if not needed
    let prevStepIndex = currentStep - 1;
    if (prevStepIndex >= 0 && 
        formSections[prevStepIndex].id === 'travel' && 
        !showTravelSection) {
      prevStepIndex--;
    }
    
    setCurrentStep(Math.max(prevStepIndex, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    // Validate all steps
    for (let i = 0; i < formSections.length; i++) {
      if (!validateStep(i)) {
        sonnerToast.error("Required Fields Missing", {
          description: "Please complete all required fields",
        });
        return;
      }
    }

    onSubmit(formData);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.field_name] || "";

    return (
      <div key={field.id || field.field_name} className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          {field.field_label}
          {field.is_required && <span className="text-red-500">*</span>}
        </Label>

        {field.field_type === "text" && (
          <Input
            value={value}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            className="border-2 focus:border-red-500 h-10"
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        )}

        {field.field_type === "email" && (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            className="border-2 focus:border-red-500 h-10"
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        )}

        {field.field_type === "textarea" && (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            className="w-full p-2 border-2 rounded focus:border-red-500 resize-none"
            rows={3}
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        )}

        {field.field_type === "select" && field.field_options && (
          <Select
            value={value}
            onValueChange={(val) => handleInputChange(field.field_name, val)}
          >
            <SelectTrigger className="border-2 focus:border-red-500">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.field_options.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.field_type === "checkbox" && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleInputChange(field.field_name, e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-sm">{field.field_label}</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading form...</p>
      </div>
    );
  }

  if (!canRegister) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Closed</h2>
        <p className="text-gray-600">{registrationMessage}</p>
      </div>
    );
  }

  const currentSection = formSections[currentStep];
  const sectionFields = currentSection ? getFieldsBySection(currentSection.id) : [];

  // Skip travel section if not needed
  const availableSections = formSections.filter(section => 
    section.id !== 'travel' || showTravelSection
  );

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentSection?.title || 'Form'}
          </h3>
          <p className="text-sm text-gray-500">
            Step {currentStep + 1} of {availableSections.length}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={currentStep === availableSections.length - 1 ? handleSubmit : nextStep}
          disabled={submitting}
          className="flex items-center gap-2"
        >
          {currentStep === availableSections.length - 1 ? (
            <>
              <Check className="w-4 h-4" />
              Submit
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Current Section Fields */}
      <Card>
        <CardContent className="p-6">
          {sectionFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No fields in this section.
            </div>
          ) : (
            <div className="space-y-4">
              {sectionFields.map(renderField)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Indicators */}
      <div className="flex justify-center space-x-2">
        {availableSections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setCurrentStep(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentStep ? 'bg-red-600' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            title={section.title}
          />
        ))}
      </div>
    </div>
  );
}