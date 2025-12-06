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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, ] = useState<keyof InventoryItem>("name");
  const [sortDirection, ] = useState<"asc" | "desc">("asc");

  const fetchItems = useCallback(async () => {
    try {
      const categoryParam =
        categoryFilter !== "all" ? `&category=${categoryFilter}` : "";
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/?tenant=${tenantSlug}${categoryParam}&limit=${itemsPerPage}&offset=${offset}`
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || data);
        setTotalItems(data.total || data.length);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      console.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, categoryFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  const getFilteredAndSortedItems = () => {
    const filtered = items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.condition.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? -1 : 1;
      if (bValue == null) return sortDirection === "asc" ? 1 : -1;

      if (sortField === "created_at") {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();

      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const exportInventoryToCSV = (items: InventoryItem[]) => {
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
    a.download = "inventory.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredItems = getFilteredAndSortedItems();


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
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-56 text-sm">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="stationary">Stationary</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="ict_equipment">ICT Equipment/Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportInventoryToCSV(filteredItems)}
                  className="text-xs"
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
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-end mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">No inventory items yet</h3>
                <p className="text-xs text-gray-500 mb-4">Get started by adding your first inventory item</p>
              </div>
            ) : (
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
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs">{item.name}</TableCell>
                      <TableCell className="text-xs">
                        {item.category === "ict_equipment"
                          ? "ICT Equipment"
                          : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
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
            )}
          </CardContent>
        </Card>

        <AddItemModal
          open={showModal}
          onOpenChange={setShowModal}
          editingItem={editingItem}
          onSubmit={handleSubmit}
        />

        {totalItems > itemsPerPage && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border-2 border-gray-300 hover:border-red-500 text-gray-700 hover:text-red-700 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from(
                { length: Math.ceil(totalItems / itemsPerPage) },
                (_, i) => i + 1
              )
                .filter((page) => {
                  const totalPages = Math.ceil(totalItems / itemsPerPage);
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (page >= currentPage - 1 && page <= currentPage + 1)
                    return true;
                  return false;
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showEllipsis && (
                        <span className="text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 p-0 rounded-lg transition-all duration-200 ${
                          currentPage === page
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                            : "border-2 border-gray-300 hover:border-red-500 text-gray-700 hover:text-red-700"
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
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage))
                )
              }
              disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
              className="border-2 border-gray-300 hover:border-red-500 text-gray-700 hover:text-red-700 px-4 py-2 rounded-lg transition-all duration-200"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
