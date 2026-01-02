"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface AddParticipantFormProps {
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  roleFilter?: string;
  loading: boolean;
  onAddParticipant: (participant: { full_name: string; email: string }) => void;
  allowAdminAdd: boolean;
}

export function AddParticipantForm({
  showAddForm,
  setShowAddForm,
  roleFilter,
  loading,
  onAddParticipant,
  allowAdminAdd,
}: AddParticipantFormProps) {
  const [newParticipant, setNewParticipant] = useState({
    full_name: "",
    email: "",
  });

  const handleSubmit = () => {
    if (!newParticipant.full_name.trim() || !newParticipant.email.trim()) return;
    onAddParticipant(newParticipant);
    setNewParticipant({ full_name: "", email: "" });
  };

  if (!showAddForm || !allowAdminAdd) return null;

  return (
    <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 space-y-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5 text-red-600" />
        <h4 className="text-lg font-semibold text-gray-900">
          Add New {roleFilter || "Participant"}
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <Input
            placeholder="Enter full name"
            value={newParticipant.full_name}
            onChange={(e) =>
              setNewParticipant({
                ...newParticipant,
                full_name: e.target.value,
              })
            }
            className="border-gray-300 focus:border-red-500 focus:ring-red-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <Input
            placeholder="Enter email address"
            type="email"
            value={newParticipant.email}
            onChange={(e) =>
              setNewParticipant({
                ...newParticipant,
                email: e.target.value,
              })
            }
            className="border-gray-300 focus:border-red-500 focus:ring-red-500"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          disabled={
            !newParticipant.full_name || !newParticipant.email || loading
          }
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add {roleFilter || "Participant"}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAddForm(false)}
          className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-all duration-200"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}