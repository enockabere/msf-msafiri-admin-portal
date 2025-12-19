"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Trash2, Lock, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/auth";
import Swal from "sweetalert2";

interface FormField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: string[];
  is_required: boolean;
  order_index: number;
  is_core?: boolean;
  is_protected?: boolean;
  section?: string;
}

interface DynamicFormPreviewProps {
  eventId: number;
}

export default function DynamicFormPreview({ eventId }: DynamicFormPreviewProps) {
  const { apiClient } = useAuthenticatedApi();
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // Core fields that cannot be deleted (protected)
  const protectedFields = [
    "firstName",
    "lastName",
    "oc",
    "contractStatus",
    "genderIdentity",
    "personalEmail",
    "phoneNumber",
    "codeOfConductConfirm"  // Code of Conduct field must not be deleted
  ];

  // Form sections for better organization
  const formSections = [
    { id: 'personal', title: 'Personal Information', order: 1 },
    { id: 'contact', title: 'Contact Details', order: 2 },
    { id: 'travel', title: 'Travel & Accommodation', order: 3 },
    { id: 'final', title: 'Final Details', order: 4 }
  ];

  // Core fields organized by sections
  const coreFields: FormField[] = [
    // Personal Information Section (1)
    { field_name: "firstName", field_label: "First Name", field_type: "text", is_required: true, order_index: 101, section: "personal", is_core: true, is_protected: true },
    { field_name: "lastName", field_label: "Last Name", field_type: "text", is_required: true, order_index: 102, section: "personal", is_core: true, is_protected: true },
    { field_name: "oc", field_label: "What is your OC?", field_type: "select", field_options: ["OCA", "OCB", "OCBA", "OCG", "OCP", "WACA"], is_required: true, order_index: 103, section: "personal", is_core: true, is_protected: true },
    { field_name: "contractStatus", field_label: "Contract Status", field_type: "select", field_options: ["On contract", "Between contracts"], is_required: true, order_index: 104, section: "personal", is_core: true, is_protected: true },
    { field_name: "contractType", field_label: "Type of Contract", field_type: "select", field_options: ["HQ", "IMS", "LRS", "Other"], is_required: true, order_index: 105, section: "personal", is_core: true },
    { field_name: "genderIdentity", field_label: "Gender Identity", field_type: "select", field_options: ["Man", "Woman", "Non-binary", "Prefer to self-describe", "Prefer not to disclose"], is_required: true, order_index: 106, section: "personal", is_core: true, is_protected: true },
    { field_name: "sex", field_label: "Sex", field_type: "select", field_options: ["Female", "Male", "Other"], is_required: true, order_index: 107, section: "personal", is_core: true },
    { field_name: "pronouns", field_label: "Pronouns", field_type: "select", field_options: ["He / him", "She / her", "They / Them", "Other"], is_required: true, order_index: 108, section: "personal", is_core: true },
    { field_name: "currentPosition", field_label: "Current (or most recent) Position", field_type: "text", is_required: true, order_index: 109, section: "personal", is_core: true },
    { field_name: "countryOfWork", field_label: "Country of Work", field_type: "text", is_required: false, order_index: 110, section: "personal", is_core: true },
    { field_name: "projectOfWork", field_label: "Project of Work", field_type: "text", is_required: false, order_index: 111, section: "personal", is_core: true },
    
    // Contact Details Section (2)
    { field_name: "personalEmail", field_label: "Personal/Tembo Email Address", field_type: "email", is_required: true, order_index: 201, section: "contact", is_core: true, is_protected: true },
    { field_name: "msfEmail", field_label: "MSF Email Address", field_type: "email", is_required: false, order_index: 202, section: "contact", is_core: true },
    { field_name: "hrcoEmail", field_label: "HRCO Email Address", field_type: "email", is_required: false, order_index: 203, section: "contact", is_core: true },
    { field_name: "careerManagerEmail", field_label: "Career Manager Email Address", field_type: "email", is_required: false, order_index: 204, section: "contact", is_core: true },
    { field_name: "lineManagerEmail", field_label: "Line Manager Email Address", field_type: "email", is_required: false, order_index: 205, section: "contact", is_core: true },
    { field_name: "phoneNumber", field_label: "Phone Number", field_type: "text", is_required: true, order_index: 206, section: "contact", is_core: true, is_protected: true },
    
    // Travel & Accommodation Section (3)
    { field_name: "travellingInternationally", field_label: "Will you be travelling internationally for this event?", field_type: "select", field_options: ["Yes", "No"], is_required: true, order_index: 301, section: "travel", is_core: true },
    { field_name: "travellingFromCountry", field_label: "Which country will you be travelling from?", field_type: "text", is_required: false, order_index: 302, section: "travel", is_core: true },
    { field_name: "accommodationType", field_label: "Accommodation Type", field_type: "select", field_options: ["Staying at accommodation", "Travelling daily"], is_required: true, order_index: 303, section: "travel", is_core: true },
    { field_name: "dietaryRequirements", field_label: "Dietary Requirements", field_type: "textarea", is_required: false, order_index: 304, section: "travel", is_core: true },
    { field_name: "accommodationNeeds", field_label: "Accommodation Needs", field_type: "textarea", is_required: false, order_index: 305, section: "travel", is_core: true },
    { field_name: "dailyMeals", field_label: "Daily Meals (if travelling daily)", field_type: "select", field_options: ["Breakfast", "Lunch", "Dinner"], is_required: false, order_index: 306, section: "travel", is_core: true },
    
    // Final Details Section (4)
    { field_name: "certificateName", field_label: "Name for Certificate", field_type: "text", is_required: false, order_index: 401, section: "final", is_core: true },
    { field_name: "badgeName", field_label: "Name for Badge", field_type: "text", is_required: false, order_index: 402, section: "final", is_core: true },
    { field_name: "motivationLetter", field_label: "Motivation Letter", field_type: "textarea", is_required: false, order_index: 403, section: "final", is_core: true },
    { field_name: "codeOfConductConfirm", field_label: "Code of Conduct Confirmation", field_type: "select", field_options: ["I agree"], is_required: true, order_index: 404, section: "final", is_core: true },
    { field_name: "travelRequirementsConfirm", field_label: "Travel Requirements Confirmation", field_type: "select", field_options: ["I confirm"], is_required: true, order_index: 405, section: "final", is_core: true },
  ];

  useEffect(() => {
    loadFormFields();
  }, [eventId]);

  const loadFormFields = async () => {
    try {
      const response = await apiClient.request<FormField[]>(`/form-fields/events/${eventId}/form-fields`);

      // If no fields exist, initialize default fields
      if (response.length === 0) {
        try {
          await apiClient.request(`/form-fields/events/${eventId}/initialize-default-fields`, {
            method: "POST",
          });
          // Reload fields after initialization
          const newResponse = await apiClient.request<FormField[]>(`/form-fields/events/${eventId}/form-fields`);
          setFields(newResponse.sort((a, b) => a.order_index - b.order_index));
        } catch (initError) {
          console.error("Error initializing default fields:", initError);
          setFields(response);
        }
      } else {
        // Only use fields from API - don't merge with hardcoded coreFields
        // The backend has all necessary fields
        setFields(response.sort((a, b) => a.order_index - b.order_index));
      }
    } catch (error) {
      console.error("Error loading form fields:", error);
      setFields([]);
    }
  };

  const getFieldsBySection = (sectionId: string) => {
    return fields.filter(field => {
      // For custom fields, use their section property
      if (field.section) {
        return field.section === sectionId;
      }
      // For core fields, find their section from coreFields definition
      const coreField = coreFields.find(cf => cf.field_name === field.field_name);
      return coreField?.section === sectionId;
    }).sort((a, b) => a.order_index - b.order_index);
  };

  const getQuestionNumber = (field: FormField) => {
    const fieldSection = field.section || coreFields.find(cf => cf.field_name === field.field_name)?.section;
    const sectionFields = getFieldsBySection(fieldSection || 'personal');
    const fieldIndex = sectionFields.findIndex(f => {
      // For fields with IDs, match by ID; for core fields, match by field_name
      if (field.id && f.id) {
        return f.id === field.id;
      }
      return f.field_name === field.field_name;
    });
    return fieldIndex + 1;
  };

  const handleEdit = (field: FormField) => {
    setEditingField(field.id ? field.id.toString() : field.field_name);
    setEditLabel(field.field_label);
  };

  const handleSaveEdit = async (field: FormField) => {
    try {
      if (field.id) {
        // Update custom field via API
        await apiClient.request(`/form-fields/form-fields/${field.id}`, {
          method: "PUT",
          body: JSON.stringify({ field_label: editLabel }),
        });
      }
      // Update in local state (works for both core and custom fields)
      setFields(fields.map(f => 
        (f.id === field.id || f.field_name === field.field_name) 
          ? { ...f, field_label: editLabel } 
          : f
      ));
      setEditingField(null);
    } catch (error) {
      console.error("Error updating field:", error);
    }
  };

  const handleDelete = async (field: FormField) => {
    // Prevent deletion of protected fields
    if (field.is_protected) {
      Swal.fire({
        title: 'Cannot Delete Field',
        text: 'This field cannot be deleted as it is required for registration.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Delete Field?',
      text: `Are you sure you want to delete "${field.field_label}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      if (field.id) {
        // Delete custom field via API
        await apiClient.request(`/form-fields/form-fields/${field.id}`, {
          method: "DELETE",
        });
      }
      // Remove from local state (works for both core and custom fields)
      setFields(fields.filter(f => {
        if (field.id && f.id) {
          return f.id !== field.id;
        }
        return f.field_name !== field.field_name;
      }));
    } catch (error) {
      console.error("Error deleting field:", error);
    }
  };

  const renderField = (field: FormField) => {
    const fieldKey = field.id ? field.id.toString() : field.field_name;
    const isEditing = editingField === fieldKey;

    return (
      <Card key={field.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            {isEditing ? (
              <div className="flex-1 flex gap-2">
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => handleSaveEdit(field)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <span className="inline-flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                      Q{getQuestionNumber(field)}
                    </span>
                    {field.field_label}
                  </span>
                  {field.is_required && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex gap-1 items-center">
                  {field.is_protected && (
                    <div className="flex items-center gap-1 text-amber-600 mr-2">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs font-medium">Protected</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(field)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(field)}
                    className={`h-8 w-8 p-0 ${
                      field.is_protected 
                        ? "text-gray-400 cursor-not-allowed" 
                        : "text-red-500 hover:text-red-700"
                    }`}
                    title={field.is_protected ? "This field cannot be deleted" : "Delete field"}
                    disabled={field.is_protected}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div>
              {field.field_type === "text" && (
                <Input placeholder={`Enter ${field.field_label.toLowerCase()}`} disabled />
              )}
              {field.field_type === "email" && (
                <Input type="email" placeholder={`Enter ${field.field_label.toLowerCase()}`} disabled />
              )}
              {field.field_type === "textarea" && (
                <textarea
                  className="w-full p-2 border rounded resize-none"
                  rows={3}
                  placeholder={`Enter ${field.field_label.toLowerCase()}`}
                  disabled
                />
              )}
              {field.field_type === "richtext" && (
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 min-h-[150px]">
                  <p className="text-sm text-gray-500 italic">Rich text editor (with formatting toolbar)</p>
                  <div className="mt-2 text-gray-400 text-sm">
                    Users can format text with bold, italic, lists, links, etc.
                  </div>
                </div>
              )}
              {field.field_type === "select" && field.field_options && (
                <Select>
                  <SelectTrigger className="w-full">
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
              {field.field_name === "dailyMeals" && (
                <div className="space-y-2">
                  {["Breakfast", "Lunch", "Dinner"].map((meal) => (
                    <div key={meal} className="flex items-center gap-2">
                      <input type="checkbox" disabled />
                      <span className="text-sm">{meal}</span>
                    </div>
                  ))}
                </div>
              )}
              {field.field_type === "checkbox" && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" disabled />
                  <span className="text-sm">{field.field_label}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const currentSection = formSections[currentStep];
  const sectionFields = currentSection ? getFieldsBySection(currentSection.id) : [];

  return (
    <div className="space-y-6">
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Registration Form Preview</h4>
            <div className="space-y-1 text-sm">
              <p className="text-blue-800">
                <span className="inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <strong className="text-amber-700">Protected Fields:</strong>
                </span>
                <span className="text-blue-700 ml-1">Cannot be deleted</span>
              </p>
              <p className="text-blue-700">
                <strong>Navigation:</strong> Use arrows to preview different form sections
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentSection?.title || 'No Section'}
          </h3>
          <p className="text-sm text-gray-500">
            Step {currentStep + 1} of {formSections.length}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.min(formSections.length - 1, currentStep + 1))}
          disabled={currentStep === formSections.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Current Section Fields */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        {sectionFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No fields in this section.
          </div>
        ) : (
          <div className="space-y-4">
            {sectionFields.map((field) => {
              const fieldKey = field.id ? field.id.toString() : field.field_name;
              return <div key={fieldKey}>{renderField(field)}</div>;
            })}
          </div>
        )}
      </div>

      {/* Section Indicators */}
      <div className="flex justify-center space-x-2">
        {formSections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setCurrentStep(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentStep ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            title={section.title}
          />
        ))}
      </div>
    </div>
  );
}