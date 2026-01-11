"use client";

import { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, Save, X } from "lucide-react";
import dynamic from "next/dynamic";

const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then(mod => ({ default: mod.CKEditor })), { ssr: false });

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: any;
  setFormData: (data: any) => void;
  vendorHotels: any[];
  setSelectedVendorId: (id: string) => void;
  handleDateChange: (field: string, value: string) => void;
  submitting: boolean;
  tenantData: { timezone?: string } | null;
  isEdit?: boolean;
}

export default function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  vendorHotels,
  setSelectedVendorId,
  handleDateChange,
  submitting,
  tenantData,
  isEdit = false
}: EventFormModalProps) {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@ckeditor/ckeditor5-build-classic')
        .then((module) => {
          editorRef.current = module.default;
          setEditorLoaded(true);
        })
        .catch((error) => {
          console.error('Error loading CKEditor:', error);
        });
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {isEdit ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm mt-1">
                {isEdit ? 'Update the event details below' : 'Set up a new event for your organization'}
              </DialogDescription>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto modal-scrollbar">
          <div className="p-8 pb-0">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor={isEdit ? "edit_title" : "title"} className="text-sm font-medium text-gray-700">
                    Event Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={isEdit ? "edit_title" : "title"}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={isEdit ? "edit_event_type" : "event_type"} className="text-sm font-medium text-gray-700">
                    Event Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="Conference" className="hover:bg-gray-100 focus:bg-gray-100">Conference</SelectItem>
                      <SelectItem value="Workshop" className="hover:bg-gray-100 focus:bg-gray-100">Workshop</SelectItem>
                      <SelectItem value="Training" className="hover:bg-gray-100 focus:bg-gray-100">Training</SelectItem>
                      <SelectItem value="Meeting" className="hover:bg-gray-100 focus:bg-gray-100">Meeting</SelectItem>
                      <SelectItem value="Seminar" className="hover:bg-gray-100 focus:bg-gray-100">Seminar</SelectItem>
                      <SelectItem value="Webinar" className="hover:bg-gray-100 focus:bg-gray-100">Webinar</SelectItem>
                      <SelectItem value="Other" className="hover:bg-gray-100 focus:bg-gray-100">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor={isEdit ? "edit_description" : "description"} className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </Label>
                <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ck-editor__editable]:min-h-[250px] [&_.ck-editor__editable]:p-4 [&_.ck-editor__top]:bg-gray-50 [&_.ck-editor__top]:border-b [&_.ck-editor__top]:border-gray-300 [&_.ck.ck-toolbar]:border-none [&_.ck-editor__editable]:focus:border-blue-500 [&_.ck-editor__editable]:focus:ring-1 [&_.ck-editor__editable]:focus:ring-blue-500">
                  {editorLoaded && editorRef.current ? (
                    <CKEditor
                      editor={editorRef.current}
                      data={formData.description}
                      onChange={(event: any, editor: any) => {
                        const data = editor.getData();
                        setFormData({ ...formData, description: data });
                      }}
                      config={{
                        placeholder: "Describe the event, its purpose, and what participants can expect...",
                        toolbar: [
                          'heading', '|',
                          'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                          'outdent', 'indent', '|',
                          'blockQuote', 'undo', 'redo'
                        ]
                      }}
                    />
                  ) : (
                    <div className="min-h-[250px] flex items-center justify-center text-gray-400">
                      Loading editor...
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Use rich formatting to make your description more engaging</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor={isEdit ? "edit_vendor_accommodation_id" : "vendor_accommodation_id"} className="text-sm font-medium text-gray-700">
                    Venue (Hotel) <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.vendor_accommodation_id}
                    onValueChange={(value) => {
                      const selectedHotel = vendorHotels.find(h => h.id.toString() === value);
                      setSelectedVendorId(value);
                      setFormData({
                        ...formData,
                        vendor_accommodation_id: value,
                        location: selectedHotel?.location || "",
                        latitude: selectedHotel?.latitude || "",
                        longitude: selectedHotel?.longitude || ""
                      });
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select venue hotel" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {vendorHotels.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id.toString()} className="hover:bg-gray-100 focus:bg-gray-100">
                          {hotel.vendor_name} - {hotel.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={isEdit ? "edit_expected_participants" : "expected_participants"} className="text-sm font-medium text-gray-700">
                    Expected Participants <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={isEdit ? "edit_expected_participants" : "expected_participants"}
                    type="number"
                    value={formData.expected_participants}
                    onChange={(e) => setFormData({ ...formData, expected_participants: e.target.value })}
                    placeholder="Enter expected number of participants"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor={isEdit ? "edit_single_rooms" : "single_rooms"} className="text-sm font-medium text-gray-700">
                    Single Rooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={isEdit ? "edit_single_rooms" : "single_rooms"}
                    type="number"
                    value={formData.single_rooms}
                    onChange={(e) => setFormData({ ...formData, single_rooms: e.target.value })}
                    placeholder="Number of single rooms needed"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={isEdit ? "edit_double_rooms" : "double_rooms"} className="text-sm font-medium text-gray-700">
                    Double Rooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={isEdit ? "edit_double_rooms" : "double_rooms"}
                    type="number"
                    value={formData.double_rooms}
                    onChange={(e) => setFormData({ ...formData, double_rooms: e.target.value })}
                    placeholder="Number of double rooms needed"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor={isEdit ? "edit_start_date" : "start_date"} className="text-sm font-medium text-gray-700">
                  Start Date {tenantData?.timezone && <span className="text-gray-500 ml-1">({tenantData.timezone})</span>} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={isEdit ? "edit_start_date" : "start_date"}
                  type="date"
                  value={formData.start_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange("start_date", e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={isEdit ? "edit_end_date" : "end_date"} className="text-sm font-medium text-gray-700">
                  End Date {tenantData?.timezone && <span className="text-gray-500 ml-1">({tenantData.timezone})</span>} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={isEdit ? "edit_end_date" : "end_date"}
                  type="date"
                  value={formData.end_date}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange("end_date", e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={isEdit ? "edit_registration_deadline" : "registration_deadline"} className="text-sm font-medium text-gray-700">
                  Registration Deadline {tenantData?.timezone && <span className="text-gray-500 ml-1">({tenantData.timezone})</span>}
                </Label>
                <Input
                  id={isEdit ? "edit_registration_deadline" : "registration_deadline"}
                  type="datetime-local"
                  value={formData.registration_deadline}
                  max={formData.start_date ? `${formData.start_date}T23:59` : undefined}
                  onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {formData.duration_days && (
              <div className="mt-3 text-sm text-gray-700">
                <span className="font-medium">Event Duration:</span> <span className="font-semibold text-red-600">{formData.duration_days} {parseInt(formData.duration_days) === 1 ? 'day' : 'days'}</span>
              </div>
            )}

            {formData.vendor_accommodation_id && (
              <div className="bg-gray-50 p-4 rounded-lg mt-6 border border-gray-200">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Selected Configuration
                </Label>
                <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Hotel:</strong> {vendorHotels.find(h => h.id.toString() === formData.vendor_accommodation_id)?.vendor_name}</p>
                    <p><strong>Location:</strong> {formData.location}</p>
                  </div>
                  <div>
                    <p><strong>Expected Participants:</strong> {formData.expected_participants || 'Not set'}</p>
                    <p><strong>Room Allocation:</strong> {formData.single_rooms || 0} single, {formData.double_rooms || 0} double rooms</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Label htmlFor={isEdit ? "edit_banner_image" : "banner_image"} className="text-sm font-medium text-gray-700">
                Banner Image URL
              </Label>
              <Input
                id={isEdit ? "edit_banner_image" : "banner_image"}
                value={formData.banner_image}
                onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor={isEdit ? "edit_status" : "status"} className="text-sm font-medium text-gray-700">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEdit ? 'Updating Event...' : 'Creating Event...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? 'Update Event' : 'Create Event'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}