"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Wrench } from "lucide-react";
import { toast } from "@/components/ui/toast";

import DashboardLayout from "@/components/layout/dashboard-layout";


interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  created_at: string;
}

export default function InventoryPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    name: "",
    category: "stationary",
    quantity: 0,
    condition: "good"
  });

  const fetchItems = useCallback(async () => {
    try {
      const categoryParam = categoryFilter !== "all" ? `&category=${categoryFilter}` : "";
      const response = await fetch(`http://localhost:8000/api/v1/inventory/?tenant=${tenantSlug}${categoryParam}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      console.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, categoryFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingItem 
        ? `http://localhost:8000/api/v1/inventory/${editingItem.id}`
        : `http://localhost:8000/api/v1/inventory/`;
      
      const method = editingItem ? "PUT" : "POST";
      const payload = editingItem ? formData : { ...formData, tenant_id: tenantSlug };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: editingItem ? "Item updated successfully" : "Item added successfully",
        });
        setShowForm(false);
        setEditingItem(null);
        resetForm();
        fetchItems();
      } else {
        toast({
          title: "Error",
          description: "Failed to save item",
          variant: "destructive",
        });
      }
    } catch  {
      toast({
        title: "Error",
        description: "Error saving item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      condition: item.condition
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number, itemName: string) => {
    const { default: Swal } = await import('sweetalert2');
    
    const result = await Swal.fire({
      title: 'Delete Item?',
      text: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/inventory/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
        fetchItems();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error deleting item",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "stationary",
      quantity: 0,
      condition: "good"
    });
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "good": return "bg-green-100 text-green-800";
      case "fair": return "bg-yellow-100 text-yellow-800";
      case "poor": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stationary & Equipment</h1>
            <p className="text-gray-600">Manage your inventory items</p>
          </div>
          <Button 
            onClick={() => { setShowForm(true); setEditingItem(null); resetForm(); }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Item
          </Button>
        </div>

        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-56 h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg bg-white">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
              <SelectItem value="all" className="hover:bg-red-50 focus:bg-red-50">All Categories</SelectItem>
              <SelectItem value="stationary" className="hover:bg-red-50 focus:bg-red-50">Stationary</SelectItem>
              <SelectItem value="equipment" className="hover:bg-red-50 focus:bg-red-50">Equipment</SelectItem>
              <SelectItem value="ict_equipment" className="hover:bg-red-50 focus:bg-red-50">ICT Equipment/Items</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showForm && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-red-50">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold">
                {editingItem ? "Edit Item" : "Add New Item"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Item Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg px-4 text-gray-700"
                      placeholder="Enter item name"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Category *
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg bg-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                        <SelectItem value="stationary" className="hover:bg-red-50 focus:bg-red-50">Stationary</SelectItem>
                        <SelectItem value="equipment" className="hover:bg-red-50 focus:bg-red-50">Equipment</SelectItem>
                        <SelectItem value="ict_equipment" className="hover:bg-red-50 focus:bg-red-50">ICT Equipment/Items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity === 0 ? '' : formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                      className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg px-4 text-gray-700"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="condition" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Condition
                    </Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-red-500 rounded-lg bg-white">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                        <SelectItem value="good" className="hover:bg-red-50 focus:bg-red-50">Good</SelectItem>
                        <SelectItem value="fair" className="hover:bg-red-50 focus:bg-red-50">Fair</SelectItem>
                        <SelectItem value="poor" className="hover:bg-red-50 focus:bg-red-50">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {editingItem ? "Update Item" : "Add Item"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 px-8 py-3 rounded-lg font-semibold transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex items-center px-6 py-3 font-medium leading-6 text-sm shadow rounded-lg text-red-700 bg-red-100 transition ease-in-out duration-150">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading inventory...
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="col-span-full">
              <Card className="shadow-md border-0 bg-gradient-to-br from-white to-red-50">
                <CardContent className="text-center py-16">
                  <Package className="w-16 h-16 mx-auto mb-6 text-red-400" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No inventory items found</h3>
                  <p className="text-gray-500">Start by adding your first inventory item</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-red-50">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 shadow-sm">
                        {item.category === "equipment" ? (
                          <Wrench className="w-6 h-6 text-red-700" />
                        ) : (
                          <Package className="w-6 h-6 text-red-700" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2">{item.name}</h3>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="text-base text-gray-600">
                        <span className="font-medium">Quantity: <span className="text-gray-800 font-semibold">{item.quantity}</span></span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant="outline" 
                          className="px-2 py-1 text-xs font-medium border-2 border-red-200 text-red-700 bg-red-50"
                        >
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Badge>
                        <Badge className={`px-2 py-1 text-xs font-medium ${getConditionColor(item.condition)}`}>
                          {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(item)}
                        className="flex-1 border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 py-2 rounded-lg transition-all duration-200"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(item.id, item.name)}
                        className="flex-1 border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 py-2 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
