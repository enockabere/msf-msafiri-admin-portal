"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  condition: string;
}

interface ItemFormData {
  name: string;
  category: string;
  quantity: number;
  condition: string;
}

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: InventoryItem | null;
  onSubmit: (formData: ItemFormData) => Promise<void>;
}

export default function AddItemModal({ open, onOpenChange, editingItem, onSubmit }: AddItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "stationary",
    quantity: 0,
    condition: "good"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        condition: editingItem.condition
      });
    } else {
      setFormData({
        name: "",
        category: "stationary",
        quantity: 0,
        condition: "good"
      });
    }
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white border-0 shadow-2xl rounded-xl">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-red-100 to-red-200">
              {editingItem ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-red-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-red-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {editingItem
                  ? "Update the inventory item details below."
                  : "Fill in the details to add a new item to your inventory."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2.5">
            <Label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700"
            >
              Item Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g., Laptop, Printer, Notebook"
              className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label
                htmlFor="category"
                className="text-sm font-semibold text-gray-700"
              >
                Category <span className="text-red-600">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-gray-300">
                  <SelectItem
                    value="stationary"
                    className="hover:bg-red-50 focus:bg-red-50"
                  >
                    Stationary
                  </SelectItem>
                  <SelectItem
                    value="equipment"
                    className="hover:bg-red-50 focus:bg-red-50"
                  >
                    Equipment
                  </SelectItem>
                  <SelectItem
                    value="ict_equipment"
                    className="hover:bg-red-50 focus:bg-red-50"
                  >
                    ICT Equipment/Items
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label
                htmlFor="quantity"
                className="text-sm font-semibold text-gray-700"
              >
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity === 0 ? "" : formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity:
                      e.target.value === "" ? 0 : parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label
              htmlFor="condition"
              className="text-sm font-semibold text-gray-700"
            >
              Condition
            </Label>
            <Select
              value={formData.condition}
              onValueChange={(value) =>
                setFormData({ ...formData, condition: value })
              }
            >
              <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent className="border-gray-300">
                <SelectItem
                  value="good"
                  className="hover:bg-green-50 focus:bg-green-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Good
                  </div>
                </SelectItem>
                <SelectItem
                  value="fair"
                  className="hover:bg-yellow-50 focus:bg-yellow-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Fair
                  </div>
                </SelectItem>
                <SelectItem
                  value="poor"
                  className="hover:bg-red-50 focus:bg-red-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Poor
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-5 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingItem ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  {editingItem ? "Update Item" : "Add Item"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-11 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-semibold transition-all"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}