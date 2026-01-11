"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <DialogContent 
        className="sm:max-w-[900px] max-h-[90vh] border shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-auto"
        style={{
          backgroundColor: mounted && theme === 'dark' ? '#000000' : '#ffffff',
          borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
          color: mounted && theme === 'dark' ? '#ffffff' : '#000000'
        }}
      >
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>
                {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {editingItem ? "Update item details" : "Add a new item to your inventory"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Item Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Laptop, Printer, Notebook, Desk Chair"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-600">*</span>
              </Label>
              {!showCategoryInput ? (
                <div className="space-y-2">
                  <Select
                    value={formData.category}
                    onValueChange={handleCategorySelect}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="hover:bg-gray-100 focus:bg-gray-100">
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="_new_" className="hover:bg-gray-100 focus:bg-gray-100">+ Add New Category</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
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
                      className="flex-1"
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
                  <p className="text-xs text-muted-foreground">
                    Enter the new category name
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
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
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="good" className="hover:bg-gray-100 focus:bg-gray-100">Good - Excellent working condition</SelectItem>
                  <SelectItem value="fair" className="hover:bg-gray-100 focus:bg-gray-100">Fair - Usable with minor issues</SelectItem>
                  <SelectItem value="poor" className="hover:bg-gray-100 focus:bg-gray-100">Poor - Needs repair or replacement</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the current condition of the item
              </p>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSubmit}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
