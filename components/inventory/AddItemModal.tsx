"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Edit, Save, X } from "lucide-react";

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
      <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              {editingItem ? (
                <Edit className="w-6 h-6 text-white" />
              ) : (
                <Package className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
              </DialogTitle>
              <p className="text-red-100 text-sm mt-1">
                {editingItem
                  ? "Update the item details in your inventory"
                  : "Add a new item to track in your inventory"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto modal-scrollbar">
          <div className="p-6 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Name - Full Width */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-900 flex items-center">
                  <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                  Item Name
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Laptop, Printer, Notebook, Desk Chair"
                  className="pl-4 pr-4 py-3 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-gray-900 flex items-center">
                  <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                  Category
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200">
                    <SelectItem value="stationary" className="hover:bg-red-50 focus:bg-red-50">
                      Stationary
                    </SelectItem>
                    <SelectItem value="equipment" className="hover:bg-red-50 focus:bg-red-50">
                      Equipment
                    </SelectItem>
                    <SelectItem value="ict_equipment" className="hover:bg-red-50 focus:bg-red-50">
                      ICT Equipment/Items
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-semibold text-gray-900 flex items-center">
                  <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
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
                      quantity: e.target.value === "" ? 0 : parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter quantity"
                  className="pl-4 pr-4 py-3 text-sm border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                />
              </div>

              {/* Condition - Full Width */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="condition" className="text-sm font-semibold text-gray-900 flex items-center">
                  <div className="w-1.5 h-4 bg-red-600 rounded-full mr-2"></div>
                  Condition
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200">
                    <SelectItem value="good" className="hover:bg-green-50 focus:bg-green-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <span className="font-medium">Good</span>
                        <span className="text-xs text-gray-500">- Excellent working condition</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="fair" className="hover:bg-yellow-50 focus:bg-yellow-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <span className="font-medium">Fair</span>
                        <span className="text-xs text-gray-500">- Usable with minor issues</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="poor" className="hover:bg-red-50 focus:bg-red-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="font-medium">Poor</span>
                        <span className="text-xs text-gray-500">- Needs repair or replacement</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons - Sticky at bottom */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingItem ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? "Update Item" : "Add Item"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}