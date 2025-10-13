"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  UtensilsCrossed,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface FoodMenuItem {
  id: number;
  day_number: number;
  meal_type: string;
  menu_items: string;
  dietary_notes?: string;
  created_at: string;
}

interface DietaryRequirement {
  participant_name: string;
  participant_email: string;
  dietary_requirements?: string;
  allergies?: string;
}

interface EventFoodProps {
  eventId: number;
  tenantSlug: string;
  eventHasEnded?: boolean;
  eventDays: number;
}

export default function EventFood({
  eventId,
  eventHasEnded = false,
  eventDays,
}: EventFoodProps) {
  const { accessToken } = useAuth();
  const [foodMenu, setFoodMenu] = useState<FoodMenuItem[]>([]);
  const [dietaryRequirements, setDietaryRequirements] = useState<DietaryRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    day_number: 1,
    meal_type: "breakfast",
    menu_items: "",
    dietary_notes: "",
  });

  const mealTypes = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack/Break" },
  ];

  const fetchFoodMenu = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/food/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFoodMenu(data);
      }
    } catch (error) {
      console.error("Failed to fetch food menu:", error);
    }
  }, [eventId, accessToken]);

  const fetchDietaryRequirements = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/food/dietary-requirements`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDietaryRequirements(data);
      }
    } catch (error) {
      console.error("Failed to fetch dietary requirements:", error);
    }
  }, [eventId, accessToken]);

  useEffect(() => {
    fetchFoodMenu();
    fetchDietaryRequirements();
  }, [fetchFoodMenu, fetchDietaryRequirements]);

  const handleSubmit = async () => {
    if (!formData.menu_items.trim()) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Please enter menu items.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/food/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/food/`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchFoodMenu();
        handleCloseForm();

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Success!",
          description: `Menu item ${
            editingId ? "updated" : "created"
          } successfully.`,
        });
      } else {
        throw new Error("Failed to save menu item");
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to save menu item.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: FoodMenuItem) => {
    setEditingId(item.id);
    setFormData({
      day_number: item.day_number,
      meal_type: item.meal_type,
      menu_items: item.menu_items,
      dietary_notes: item.dietary_notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/food/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchFoodMenu();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Deleted!",
          description: "Menu item deleted successfully.",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to delete menu item.",
        variant: "destructive",
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      day_number: 1,
      meal_type: "breakfast",
      menu_items: "",
      dietary_notes: "",
    });
  };

  const groupedMenu = foodMenu.reduce((acc, item) => {
    const key = `Day ${item.day_number}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, FoodMenuItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Food & Menu</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage daily menus and view dietary requirements
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={eventHasEnded}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Dietary Requirements Section */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h4 className="font-semibold text-gray-900">
                Participant Dietary Requirements
              </h4>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {dietaryRequirements.filter(req => req.dietary_requirements || req.allergies).length} with requirements
            </Badge>
          </div>
        </div>
        <div className="p-4">
          {dietaryRequirements.length > 0 ? (
            <div className="grid gap-3">
              {dietaryRequirements.map((req, index) => {
                const hasRequirements = req.dietary_requirements || req.allergies;
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      hasRequirements 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {req.participant_name}
                        </div>
                        <div className="text-sm text-gray-600">{req.participant_email}</div>
                        
                        {hasRequirements ? (
                          <div className="mt-2 space-y-1">
                            {req.dietary_requirements && (
                              <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                  Dietary
                                </Badge>
                                <span className="text-sm text-gray-700">{req.dietary_requirements}</span>
                              </div>
                            )}
                            {req.allergies && (
                              <div className="flex items-start gap-2">
                                <Badge variant="destructive" className="text-xs">
                                  Allergies
                                </Badge>
                                <span className="text-sm text-red-700 font-medium">{req.allergies}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs text-gray-500">
                              No special requirements
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {hasRequirements && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p>No participant dietary information available</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu by Day */}
      <div className="space-y-4">
        {Array.from({ length: eventDays }, (_, i) => i + 1).map((dayNum) => {
          const dayKey = `Day ${dayNum}`;
          const dayMenu = groupedMenu[dayKey] || [];

          return (
            <div key={dayNum} className="bg-white border rounded-lg">
              <div className="p-4 border-b bg-gray-50">
                <h4 className="font-semibold flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-red-600" />
                  Day {dayNum} Menu
                </h4>
              </div>
              <div className="p-4">
                {dayMenu.length > 0 ? (
                  <div className="space-y-3">
                    {dayMenu
                      .sort((a, b) => {
                        const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                        return (order[a.meal_type as keyof typeof order] || 5) - 
                               (order[b.meal_type as keyof typeof order] || 5);
                      })
                      .map((item) => (
                        <div key={item.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="capitalize">
                                  {item.meal_type}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-900 mb-1">
                                <strong>Menu:</strong> {item.menu_items}
                              </div>
                              {item.dietary_notes && (
                                <div className="text-sm text-gray-600">
                                  <strong>Notes:</strong> {item.dietary_notes}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                disabled={eventHasEnded}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                disabled={eventHasEnded}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No menu items for this day
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Day *</label>
                <select
                  value={formData.day_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, day_number: parseInt(e.target.value) }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {Array.from({ length: eventDays }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Day {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Meal Type *</label>
                <select
                  value={formData.meal_type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, meal_type: e.target.value }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {mealTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Menu Items *</label>
              <textarea
                value={formData.menu_items}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, menu_items: e.target.value }))
                }
                placeholder="Enter menu items (e.g., Grilled chicken, Rice, Vegetables, Fruit salad)"
                className="w-full p-2 border border-gray-300 rounded-md h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dietary Notes</label>
              <textarea
                value={formData.dietary_notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dietary_notes: e.target.value }))
                }
                placeholder="Special dietary considerations, allergen information, etc."
                className="w-full p-2 border border-gray-300 rounded-md h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}