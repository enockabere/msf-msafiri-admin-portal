"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, GripVertical, Loader2 } from "lucide-react";
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
  is_active?: boolean;
  is_protected?: boolean;
  section?: string;
}

interface FormBuilderProps {
  eventId: number;
  onSave?: () => void;
}

export default function FormBuilder({ eventId, onSave }: FormBuilderProps) {
  const { apiClient } = useAuthenticatedApi();
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const formSections = [
    { id: 'personal', title: 'Personal Information', range: '101-199' },
    { id: 'contact', title: 'Contact Details', range: '201-299' },
    { id: 'travel', title: 'Travel & Accommodation', range: '301-399' },
    { id: 'final', title: 'Final Details', range: '401-499' }
  ];

  useEffect(() => {
    loadFormFields();
  }, [eventId]);

  const loadFormFields = async () => {
    console.log("📂 ============ LOADING FORM FIELDS ============");
    console.log("📂 Event ID:", eventId);
    console.log("📂 API URL:", `/form-fields/events/${eventId}/form-fields`);

    try {
      console.log("📂 Making API request...");
      const response = await apiClient.request<FormField[]>(`/form-fields/events/${eventId}/form-fields`);
      console.log("✅ Form fields loaded successfully");
      console.log("✅ Fields count:", response.length);
      console.log("✅ Fields data:", JSON.stringify(response, null, 2));

      // If no fields exist, initialize default fields
      if (response.length === 0) {
        console.log("⚠️ No fields found, initializing default fields...");
        try {
          console.log("📂 Calling initialize-default-fields endpoint...");
          await apiClient.request(`/form-fields/events/${eventId}/initialize-default-fields`, {
            method: "POST",
          });
          console.log("✅ Default fields initialized");

          // Reload fields after initialization
          console.log("📂 Reloading fields after initialization...");
          const newResponse = await apiClient.request<FormField[]>(`/form-fields/events/${eventId}/form-fields`);
          console.log("✅ Reloaded fields count:", newResponse.length);
          console.log("✅ Reloaded fields data:", JSON.stringify(newResponse, null, 2));
          setFields(newResponse);
        } catch (initError) {
          console.error("🔴 Error initializing default fields:", initError);
          console.error("🔴 Init error type:", initError?.constructor?.name);
          console.error("🔴 Init error message:", initError?.message);
          setFields(response);
        }
      } else {
        console.log("✅ Setting fields to state");
        setFields(response);
      }

      console.log("✅ ============ FORM FIELDS LOAD COMPLETE ============");
    } catch (error) {
      console.error("🔴 ============ ERROR LOADING FORM FIELDS ============");
      console.error("🔴 Error:", error);
      console.error("🔴 Error type:", error?.constructor?.name);
      console.error("🔴 Error message:", error?.message);
      console.error("🔴 Full error:", JSON.stringify(error, null, 2));
      console.error("🔴 ============ END ERROR ============");
    } finally {
      setLoading(false);
    }
  };

  const restoreMissingFields = async () => {
    try {
      const result = await Swal.fire({
        title: 'Restore Missing Fields?',
        text: 'This will add back any missing important fields like line manager email, HRCO email, etc. without affecting existing fields.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, restore fields!',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) return;
      
      const response = await apiClient.request(`/form-fields/events/${eventId}/restore-complete-fields`, {
        method: "POST",
      });
      
      Swal.fire({
        title: 'Success!',
        text: `Restored ${response.created_count} missing fields. Total fields: ${response.total_fields}`,
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });
      
      // Reload fields
      loadFormFields();
    } catch (error) {
      console.error("Error restoring fields:", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to restore missing fields. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const updateCountryFields = async () => {
    try {
      const result = await Swal.fire({
        title: 'Update Country Fields?',
        text: 'This will update nationality and country of work fields to use dropdown with countries API.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, update fields!',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) return;
      
      const response = await apiClient.request(`/form-fields/events/${eventId}/update-country-fields`, {
        method: "POST",
      });
      
      Swal.fire({
        title: 'Success!',
        text: `Updated ${response.updated_fields.length} country fields to use countries API.`,
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });
      
      // Force a complete reload with a small delay to ensure database changes are committed
      setTimeout(() => {
        loadFormFields();
      }, 500);
    } catch (error) {
      console.error("Error updating country fields:", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update country fields. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };
  const removeDuplicates = async () => {
    try {
      const result = await Swal.fire({
        title: 'Remove Duplicate Fields?',
        text: 'This will remove duplicate form fields, keeping only the first occurrence of each field. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, remove duplicates!',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) return;
      
      const response = await apiClient.request(`/form-fields/events/${eventId}/remove-duplicates`, {
        method: "POST",
      });
      
      Swal.fire({
        title: 'Success!',
        text: `Removed ${response.deleted_count} duplicate fields. ${response.remaining_fields} unique fields remain.`,
        icon: 'success',
        confirmButtonColor: '#dc2626'
      });
      
      // Reload fields
      loadFormFields();
    } catch (error) {
      console.error("Error removing duplicates:", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to remove duplicates. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const addField = () => {
    console.log("🔵 Add Field button clicked!");
    console.log("Current fields count:", fields.length);

    // Find the highest order_index in the personal section
    const personalFields = fields.filter(f => f.section === 'personal');
    console.log("Personal section fields:", personalFields.length);

    const maxOrderIndex = personalFields.length > 0
      ? Math.max(...personalFields.map(f => f.order_index))
      : 100;

    console.log("Max order index:", maxOrderIndex);

    const fieldName = `field_${Date.now()}`;
    const newField: FormField = {
      field_name: fieldName,
      field_label: "New Field",
      field_type: "text",
      is_required: false,
      order_index: maxOrderIndex + 1,
      section: 'personal',
      is_protected: false,
      is_active: true,
    };

    console.log("Creating new field:", newField);
    setFields([...fields, newField]);
    console.log("✅ New field added to state");

    // Scroll to the newly added field after a short delay
    setTimeout(() => {
      const newFieldElement = document.getElementById(`field-card-${fieldName}`);
      if (newFieldElement) {
        newFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log("📜 Scrolled to new field");
      }
    }, 100);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = async (index: number) => {
    const field = fields[index];

    // Prevent deletion of protected core fields
    const protectedFields = [
      "firstName",
      "lastName",
      "oc",
      "contractStatus",
      "genderIdentity",
      "personalEmail",
      "phoneNumber",
      "travellingInternationally",
      "travellingFromCountry",
      "accommodationType",
      "dietaryRequirements",
      "codeOfConductConfirm"  // Code of Conduct field must not be deleted
    ];
    if (protectedFields.includes(field.field_name) || field.is_protected) {
      Swal.fire({
        title: 'Cannot Delete Field',
        text: 'This field cannot be deleted as it is required for registration and linked to the database schema.',
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
    
    if (!result.isConfirmed) {
      return;
    }
    
    try {
      if (field.id) {
        await apiClient.request(`/form-fields/form-fields/${field.id}`, {
          method: "DELETE",
        });
      }
      
      const updatedFields = fields.filter((_, i) => i !== index);
      // Refresh question numbers within each section
      refreshQuestionNumbers(updatedFields);
      setFields(updatedFields);
      
      Swal.fire({
        title: 'Deleted!',
        text: 'Field has been deleted successfully.',
        icon: 'success',
        confirmButtonColor: '#dc2626',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error deleting field:", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete field. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };



  const moveField = (fromIndex: number, toIndex: number) => {
    const items = Array.from(fields);
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));
    
    setFields(updatedItems);
  };

  const getQuestionPosition = (field: FormField, index: number) => {
    const sectionFields = fields.filter(f => f.section === field.section).sort((a, b) => a.order_index - b.order_index);
    const fieldIndex = sectionFields.findIndex(f => {
      // For new fields without ID, use field_name and order_index
      if (!field.id && !f.id) {
        return f.field_name === field.field_name && f.order_index === field.order_index;
      }
      if (field.id && f.id) {
        return f.id === field.id;
      }
      return f.field_name === field.field_name;
    });
    return fieldIndex >= 0 ? fieldIndex + 1 : sectionFields.length + 1;
  };

  const moveToPosition = (fieldIndex: number, newPosition: number) => {
    const field = fields[fieldIndex];
    const sectionFields = fields.filter(f => f.section === field.section).sort((a, b) => a.order_index - b.order_index);
    const currentPos = sectionFields.findIndex(f => {
      if (field.id && f.id) return f.id === field.id;
      return f.field_name === field.field_name;
    });
    const targetPos = Math.max(0, Math.min(sectionFields.length - 1, newPosition - 1));
    
    if (currentPos === targetPos) return;
    
    // Reorder within section
    const reordered = [...sectionFields];
    const [moved] = reordered.splice(currentPos, 1);
    reordered.splice(targetPos, 0, moved);
    
    // Update order_index for section fields
    const sectionStart = field.section === 'personal' ? 101 : 
                        field.section === 'contact' ? 201 :
                        field.section === 'travel' ? 301 : 401;
    
    reordered.forEach((f, i) => {
      f.order_index = sectionStart + i;
    });
    
    // Update the main fields array
    const updatedFields = fields.map(f => {
      const reorderedField = reordered.find(rf => {
        if (f.id && rf.id) return f.id === rf.id;
        return f.field_name === rf.field_name;
      });
      return reorderedField || f;
    });
    
    setFields(updatedFields);
  };

  const refreshQuestionNumbers = (fieldList: FormField[]) => {
    formSections.forEach(section => {
      const sectionFields = fieldList.filter(f => f.section === section.id).sort((a, b) => a.order_index - b.order_index);
      const sectionStart = section.id === 'personal' ? 101 : 
                          section.id === 'contact' ? 201 :
                          section.id === 'travel' ? 301 : 401;
      
      sectionFields.forEach((field, i) => {
        field.order_index = sectionStart + i;
      });
    });
  };

  const saveFields = async () => {
    console.log('💾 ============ SAVING FORM FIELDS ============');
    console.log('💾 Event ID:', eventId);
    console.log('💾 Total fields to save:', fields.length);
    console.log('💾 Fields:', JSON.stringify(fields, null, 2));

    setSaving(true);
    try {
      let savedCount = 0;
      let updatedCount = 0;
      let createdCount = 0;

      for (const field of fields) {
        if (field.id) {
          console.log(`💾 Updating field #${field.id}: ${field.field_label}`);
          await apiClient.request(`/form-fields/form-fields/${field.id}`, {
            method: "PUT",
            body: JSON.stringify({
              field_label: field.field_label,
              field_type: field.field_type,
              field_options: field.field_options,
              is_required: field.is_required,
              order_index: field.order_index,
              section: field.section,
            }),
          });
          updatedCount++;
          console.log(`✅ Updated field #${field.id}`);
        } else {
          console.log(`💾 Creating new field: ${field.field_label}`);
          await apiClient.request(`/form-fields/events/${eventId}/form-fields`, {
            method: "POST",
            body: JSON.stringify(field),
          });
          createdCount++;
          console.log(`✅ Created new field: ${field.field_label}`);
        }
        savedCount++;
      }

      console.log('✅ ============ SAVE COMPLETE ============');
      console.log(`✅ Total saved: ${savedCount}`);
      console.log(`✅ Updated: ${updatedCount}`);
      console.log(`✅ Created: ${createdCount}`);

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'Form configuration saved successfully',
        icon: 'success',
        confirmButtonColor: '#dc2626',
        timer: 2000,
        showConfirmButton: false
      });

      console.log('💾 Calling onSave callback...');
      onSave?.();
    } catch (error) {
      console.error("🔴 ============ ERROR SAVING FORM FIELDS ============");
      console.error("🔴 Error:", error);
      console.error("🔴 Error type:", error?.constructor?.name);
      console.error("🔴 Error message:", error?.message);
      console.error("🔴 Full error:", JSON.stringify(error, null, 2));
      console.error("🔴 ============ END ERROR ============");

      Swal.fire({
        title: 'Error',
        text: 'Failed to save form configuration. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dynamic Form Fields</h3>
          <p className="text-sm text-gray-600 mt-1">Add, edit, or remove custom fields for your event registration</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addField} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
          <Button onClick={removeDuplicates} size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Remove Duplicates
          </Button>
          <Button onClick={updateCountryFields} size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            Update Country Fields
          </Button>
        </div>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id || field.field_name}
          id={`field-card-${field.field_name}`}
          className="mb-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">
                    {formSections.find(s => s.id === field.section)?.title || 'Unknown'}
                    {field.order_index && field.order_index > 0 ? ` - Q${getQuestionPosition(field, index)}` : ''}
                  </CardTitle>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveField(index, index - 1)}
                        className="text-xs px-2 py-1 h-6"
                      >
                        ↑
                      </Button>
                    )}
                    {index < fields.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveField(index, index + 1)}
                        className="text-xs px-2 py-1 h-6"
                      >
                        ↓
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                  className={`${
                    field.is_protected || ["firstName", "lastName", "oc", "contractStatus", "genderIdentity", "personalEmail", "phoneNumber", "travellingInternationally", "travellingFromCountry", "accommodationType", "dietaryRequirements"].includes(field.field_name)
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-500 hover:text-red-700"
                  }`}
                  disabled={field.is_protected || ["firstName", "lastName", "oc", "contractStatus", "genderIdentity", "personalEmail", "phoneNumber", "travellingInternationally", "travellingFromCountry", "accommodationType", "dietaryRequirements"].includes(field.field_name)}
                  title={field.is_protected || ["firstName", "lastName", "oc", "contractStatus", "genderIdentity", "personalEmail", "phoneNumber", "travellingInternationally", "travellingFromCountry", "accommodationType", "dietaryRequirements"].includes(field.field_name) ? "This field cannot be deleted" : "Delete field"}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field Label</Label>
                  <Input
                    value={field.field_label}
                    onChange={(e) => updateField(index, { field_label: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Field Type</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={field.field_type}
                      onValueChange={(value) => {
                        const updates: Partial<FormField> = { field_type: value };
                        // Initialize with empty option array when changing to select
                        if (value === 'select' && (!field.field_options || field.field_options.length === 0)) {
                          updates.field_options = [''];
                        }
                        updateField(index, updates);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="richtext">Rich Text Editor</SelectItem>
                        <SelectItem value="select">Select Dropdown</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="radio">Radio Buttons</SelectItem>
                        <SelectItem value="date">Date Picker</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.field_options && field.field_options.includes('API_COUNTRIES') && (
                      <span className="text-xs text-green-600 font-medium">🌍 Countries API</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Section</Label>
                  <Select
                    value={field.section || 'personal'}
                    onValueChange={(value) => {
                      const sectionRanges = {
                        'personal': 150,
                        'contact': 250,
                        'travel': 350,
                        'final': 450
                      };
                      updateField(index, { 
                        section: value,
                        order_index: sectionRanges[value as keyof typeof sectionRanges]
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formSections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title} ({section.range})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Question Position</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter position (e.g., 2)"
                    onChange={(e) => {
                      const newPos = parseInt(e.target.value);
                      if (newPos && newPos > 0) {
                        const sectionStart = field.section === 'personal' ? 101 : 
                                            field.section === 'contact' ? 201 :
                                            field.section === 'travel' ? 301 : 401;
                        updateField(index, { order_index: sectionStart + newPos - 1 });
                      } else if (!e.target.value) {
                        updateField(index, { order_index: 0 });
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                  <p className="text-xs text-gray-500 mt-1">Position within section (1, 2, 3...)</p>
                </div>
              </div>

              {field.field_type === "select" && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {(field.field_options || []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(field.field_options || [])];
                            newOptions[optionIndex] = e.target.value;
                            updateField(index, { field_options: newOptions });
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newOptions = (field.field_options || []).filter((_, i) => i !== optionIndex);
                            updateField(index, { field_options: newOptions });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = [...(field.field_options || []), ""];
                        updateField(index, { field_options: newOptions });
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={field.is_required}
                  onChange={(e) => updateField(index, { is_required: e.target.checked })}
                />
                <Label htmlFor={`required-${index}`}>Required field</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      <div className="sticky bottom-0 bg-white pt-6 pb-4 px-6 border-t shadow-lg mt-8">
        <Button
          onClick={saveFields}
          disabled={saving}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Form Configuration'
          )}
        </Button>
        <p className="text-center text-sm text-gray-600 mt-3">
          All changes will be reflected in the public registration form
        </p>
      </div>
    </div>
  );
}