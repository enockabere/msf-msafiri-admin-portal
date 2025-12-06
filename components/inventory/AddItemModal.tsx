"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package, Save, X } from "lucide-react";
import { useParams } from "next/navigation";

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
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: 0,
    condition: "good"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Fetch existing categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/categories?tenant=${tenantSlug}`
        );
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    if (open && tenantSlug) {
      fetchCategories();
    }
  }, [open, tenantSlug]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        condition: editingItem.condition
      });
      setShowCategoryInput(false);
      setCustomCategory("");
    } else {
      setFormData({
        name: "",
        category: "",
        quantity: 0,
        condition: "good"
      });
      setShowCategoryInput(false);
      setCustomCategory("");
    }
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        category: showCategoryInput ? customCategory : formData.category
      };
      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (value: string) => {
    if (value === "_new_") {
      setShowCategoryInput(true);
      setFormData({ ...formData, category: "" });
    } else {
      setShowCategoryInput(false);
      setFormData({ ...formData, category: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Header with close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4 text-gray-500" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
              </DialogTitle>
              <p className="text-gray-600 text-sm mt-1">
                {editingItem ? "Update item details" : "Add a new item to your inventory"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Laptop, Printer, Notebook, Desk Chair"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </Label>
              {!showCategoryInput ? (
                <div className="space-y-2">
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="_new_">+ Add New Category</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Choose an existing category or create a new one
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                      placeholder="Enter new category name"
                      className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCategoryInput(false);
                        setCustomCategory("");
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the new category name
                  </p>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
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
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition" className="text-sm font-medium text-gray-700">
                Condition
              </Label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                disabled={isSubmitting}
                className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="good">Good - Excellent working condition</option>
                <option value="fair">Fair - Usable with minor issues</option>
                <option value="poor">Poor - Needs repair or replacement</option>
              </select>
              <p className="text-xs text-gray-500">
                Select the current condition of the item
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-6"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-red-600 hover:bg-red-700 text-white"
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
