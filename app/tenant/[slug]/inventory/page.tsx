"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/layout/dashboard-layout";
import AddItemModal from "@/components/inventory/AddItemModal";

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
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch categories
  const fetchCategories = useCallback(async () => {
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
  }, [tenantSlug]);

  // Fetch items with server-side filtering and pagination
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const categoryParam = categoryFilter !== "all" ? `&category=${categoryFilter}` : "";
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const offset = (currentPage - 1) * itemsPerPage;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/?tenant=${tenantSlug}${categoryParam}${searchParam}&limit=${itemsPerPage}&offset=${offset}`
      );

      if (response.ok) {
        const data = await response.json();
        // Handle both array response and paginated response
        if (Array.isArray(data)) {
          setItems(data);
          setTotalItems(data.length);
        } else {
          setItems(data.items || []);
          setTotalItems(data.total || 0);
        }
      } else {
        toast.error("Failed to load inventory items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, categoryFilter, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchTerm]);

  const handleSubmit = async (formData: {
    name: string;
    category: string;
    quantity: number;
    condition: string;
  }) => {
    try {
      const url = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/${editingItem.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/`;

      const method = editingItem ? "PUT" : "POST";
      const payload = editingItem
        ? formData
        : { ...formData, tenant_id: tenantSlug };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingItem ? "Item updated successfully" : "Item added successfully");
        setShowModal(false);
        setEditingItem(null);
        // Refresh both items and categories (in case new category was added)
        fetchCategories();
        fetchItems();
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Failed to save item" }));
        toast.error(errorData.detail || "Failed to save item");
      }
    } catch {
      toast.error("Network error occurred");
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: number, itemName: string) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "Delete Item?",
      text: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Item deleted successfully");
        fetchItems();
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Failed to delete item" }));
        toast.error(errorData.detail || "Failed to delete item");
      }
    } catch {
      toast.error("Network error occurred");
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "good":
        return "bg-green-100 text-green-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportInventoryToCSV = () => {
    const headers = ["Name", "Category", "Quantity", "Condition", "Created At"];

    const csvData = [
      headers.join(","),
      ...items.map((item) =>
        [
          `"${item.name}"`,
          `"${item.category}"`,
          item.quantity,
          `"${item.condition}"`,
          `"${new Date(item.created_at).toLocaleDateString()}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900 mb-1">
              Stationary & Equipment
            </h1>
            <p className="text-xs text-gray-600">
              Manage your inventory items efficiently
            </p>
          </div>
          <Button
            onClick={() => {
              setShowModal(true);
              setEditingItem(null);
            }}
            className="bg-red-600 hover:bg-red-700 text-white text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add New Item
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 text-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 text-sm"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value)}
                >
                  <SelectTrigger className="w-56 text-sm">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportInventoryToCSV}
                  className="text-xs"
                  disabled={items.length === 0}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-400 animate-pulse" />
                </div>
                <p className="text-xs font-medium text-gray-600">Loading inventory...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {searchTerm || categoryFilter !== "all"
                    ? "No items found"
                    : "No inventory items yet"}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {searchTerm || categoryFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first inventory item"}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-xs">{item.name}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{item.quantity}</TableCell>
                        <TableCell className="text-xs">
                          <Badge className={`text-xs ${getConditionColor(item.condition)}`}>
                            {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="text-xs"
                      >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                            return false;
                          })
                          .map((page, index, array) => {
                            const prevPage = array[index - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;

                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsis && (
                                  <span className="text-gray-400 px-1">...</span>
                                )}
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-8 h-8 p-0 text-xs ${
                                    currentPage === page
                                      ? "bg-red-600 hover:bg-red-700 text-white"
                                      : ""
                                  }`}
                                >
                                  {page}
                                </Button>
                              </div>
                            );
                          })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="text-xs"
                      >
                        Next
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <AddItemModal
          open={showModal}
          onOpenChange={setShowModal}
          editingItem={editingItem}
          onSubmit={handleSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
