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
  Wrench,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Search,
  Download,
  ArrowUpDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

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
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof InventoryItem>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
        toast({
          title: "Success",
          description: editingItem
            ? "Item updated successfully"
            : "Item added successfully",
        });
        setShowModal(false);
        setEditingItem(null);
        fetchItems();
      } else {
        toast({
          title: "Error",
          description: "Failed to save item",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error saving item",
        variant: "destructive",
      });
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

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredItems = getFilteredAndSortedItems();

  // Calculate statistics
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = items.filter((item) => item.quantity < 10).length;
  const goodConditionItems = items.filter(
    (item) => item.condition === "good"
  ).length;
  const totalCategories = new Set(items.map((item) => item.category)).size;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Stationary & Equipment
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your inventory items efficiently
            </p>
          </div>
          <Button
            onClick={() => {
              setShowModal(true);
              setEditingItem(null);
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Item
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    Total Items
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {items.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-xl">
                  <Package className="w-8 h-8 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">
                    Total Quantity
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {totalQuantity}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 mb-1">
                    Low Stock Items
                  </p>
                  <p className="text-3xl font-bold text-amber-900">
                    {lowStockItems}
                  </p>
                </div>
                <div className="p-3 bg-amber-200 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">
                    Good Condition
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {goodConditionItems}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-56 h-10 border-gray-300 focus:border-red-500 rounded-lg bg-white">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 rounded-lg shadow-lg">
                    <SelectItem
                      value="all"
                      className="hover:bg-red-50 focus:bg-red-50"
                    >
                      All Categories
                    </SelectItem>
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

              <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
                  <Button
                    variant={viewMode === "card" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                    className={
                      viewMode === "card"
                        ? "h-8 px-3 bg-white shadow-sm"
                        : "h-8 px-3 hover:bg-gray-200"
                    }
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={
                      viewMode === "table"
                        ? "h-8 px-3 bg-white shadow-sm"
                        : "h-8 px-3 hover:bg-gray-200"
                    }
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {viewMode === "table" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportInventoryToCSV(getFilteredAndSortedItems())
                    }
                    className="gap-2 border-gray-300 hover:border-red-500 hover:text-red-700"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                )}
              </div>
            </div>

            {filteredItems.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredItems.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{items.length}</span> items
                  {searchTerm && (
                    <span className="ml-2">
                      (filtered by &quot;{searchTerm}&quot;)
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <AddItemModal
          open={showModal}
          onOpenChange={setShowModal}
          editingItem={editingItem}
          onSubmit={handleSubmit}
        />

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center px-6 py-3 font-medium leading-6 text-sm shadow rounded-lg text-red-700 bg-red-100 transition ease-in-out duration-150">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading inventory...
            </div>
          </div>
        ) : items.length === 0 ? (
          <Card className="shadow-md border-0 bg-gradient-to-br from-white to-red-50">
            <CardContent className="text-center py-16">
              <Package className="w-16 h-16 mx-auto mb-6 text-red-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No inventory items found
              </h3>
              <p className="text-gray-500">
                Start by adding your first inventory item
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <TableHead className="py-4">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="h-auto p-0 font-bold text-gray-700 hover:text-red-700 hover:bg-transparent"
                      >
                        Item
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-4">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("category")}
                        className="h-auto p-0 font-bold text-gray-700 hover:text-red-700 hover:bg-transparent"
                      >
                        Category
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-4">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("quantity")}
                        className="h-auto p-0 font-bold text-gray-700 hover:text-red-700 hover:bg-transparent"
                      >
                        Quantity
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-4">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("condition")}
                        className="h-auto p-0 font-bold text-gray-700 hover:text-red-700 hover:bg-transparent"
                      >
                        Condition
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="py-4 font-bold text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={`transition-colors hover:bg-red-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-200 shadow-sm">
                            {item.category === "equipment" ||
                            item.category === "ict_equipment" ? (
                              <Wrench className="w-5 h-5 text-red-700" />
                            ) : (
                              <Package className="w-5 h-5 text-red-700" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {item.name}
                            </span>
                            {item.quantity < 10 && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span className="text-xs text-amber-600 font-medium">
                                  Low stock
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className="px-3 py-1 text-xs font-medium border border-red-300 text-red-700 bg-red-50"
                        >
                          {item.category === "ict_equipment"
                            ? "ICT Equipment"
                            : item.category.charAt(0).toUpperCase() +
                              item.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <span
                          className={`font-semibold text-lg ${
                            item.quantity < 10
                              ? "text-amber-600"
                              : "text-gray-900"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={`px-3 py-1 text-xs font-semibold ${getConditionColor(
                            item.condition
                          )}`}
                        >
                          {item.condition.charAt(0).toUpperCase() +
                            item.condition.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-500 transition-all"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`shadow-md hover:shadow-xl transition-all duration-300 border-0 transform hover:-translate-y-1 ${
                  item.quantity < 10
                    ? "bg-gradient-to-br from-amber-50 via-white to-red-50 ring-2 ring-amber-300"
                    : "bg-gradient-to-br from-white to-red-50"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    {/* Low stock banner */}
                    {item.quantity < 10 && (
                      <div className="mb-3 -mt-2 -mx-2 px-3 py-2 bg-gradient-to-r from-amber-100 to-amber-200 rounded-lg border-l-4 border-amber-500">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span className="text-xs font-bold text-amber-800">
                            LOW STOCK ALERT
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200 shadow-md">
                        {item.category === "equipment" ||
                        item.category === "ict_equipment" ? (
                          <Wrench className="w-7 h-7 text-red-700" />
                        ) : (
                          <Package className="w-7 h-7 text-red-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 leading-tight">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Quantity
                          </span>
                          <span
                            className={`text-2xl font-bold ${
                              item.quantity < 10
                                ? "text-amber-600"
                                : item.quantity < 50
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          >
                            {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="px-3 py-1 text-xs font-semibold border border-red-300 text-red-700 bg-red-50"
                        >
                          {item.category === "ict_equipment"
                            ? "ICT Equipment"
                            : item.category.charAt(0).toUpperCase() +
                              item.category.slice(1)}
                        </Badge>
                        <Badge
                          className={`px-3 py-1 text-xs font-semibold shadow-sm ${getConditionColor(
                            item.condition
                          )}`}
                        >
                          {item.condition.charAt(0).toUpperCase() +
                            item.condition.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5 pt-4 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-500 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow"
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-500 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
