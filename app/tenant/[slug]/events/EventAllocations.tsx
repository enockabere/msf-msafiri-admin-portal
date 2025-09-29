"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Mail,
  Laptop,
  Wrench,
  FileText,
  Wine,
  Send,
  User,
  Grid3X3,
  List,
} from "lucide-react";

interface ItemAllocation {
  id: number;
  inventory_item_id: number;
  inventory_item_name: string;
  inventory_item_category: string;
  quantity_per_event: number;
  available_quantity: number;
  status: string;
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  requested_email?: string;
}

interface VoucherAllocation {
  id: number;
  drink_vouchers_per_participant: number;
  status: string;
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  condition: string;
}

interface EventAllocationsProps {
  eventId: number;
  tenantSlug: string;
  eventHasEnded?: boolean;
}

export default function EventAllocations({
  eventId,
  tenantSlug,
  eventHasEnded = false,
}: EventAllocationsProps) {
  const [itemAllocations, setItemAllocations] = useState<ItemAllocation[]>([]);
  const [voucherAllocations, setVoucherAllocations] = useState<VoucherAllocation[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [itemViewMode, setItemViewMode] = useState<'card' | 'table'>('table');
  
  // Item allocation form
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    category: "",
    items: [{ inventory_item_id: "", quantity_per_event: "" }],
    notes: "",
    requested_email: "",
  });
  
  // Voucher allocation form
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [voucherFormData, setVoucherFormData] = useState({
    drink_vouchers_per_participant: "",
    notes: "",
  });
  
  // Edit states
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
  
  // Stats
  const [voucherStats, setVoucherStats] = useState<{
    total_participants: number;
    total_allocated_vouchers: number;
    total_redeemed_vouchers: number;
  } | null>(null);

  const categories = [
    { value: "stationary", label: "Stationery", icon: FileText },
    { value: "ict_equipment", label: "ICT Equipment", icon: Laptop },
    { value: "equipment", label: "Equipment", icon: Wrench },
  ];

  const fetchItemAllocations = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!tenantResponse.ok) {
        console.error("Failed to fetch tenant data:", tenantResponse.status);
        return;
      }
      
      const tenantData = await tenantResponse.json();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/items/event/${eventId}?tenant_id=${tenantData.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Item allocations fetched:", data);
        setItemAllocations(data);
      } else {
        console.error("Failed to fetch item allocations:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch item allocations:", error);
    }
  }, [eventId, tenantSlug]);

  const fetchVoucherAllocations = useCallback(async () => {
    try {
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!tenantResponse.ok) return;
      
      const tenantData = await tenantResponse.json();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/vouchers/event/${eventId}?tenant_id=${tenantData.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVoucherAllocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch voucher allocations:", error);
    }
  }, [eventId, tenantSlug]);

  const fetchInventoryItems = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Inventory items fetched:", data);
        setInventoryItems(data);
      } else {
        console.error("Failed to fetch inventory items:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
    }
  }, [tenantSlug]);

  const fetchVoucherStats = useCallback(async () => {
    try {
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!tenantResponse.ok) return;
      
      const tenantData = await tenantResponse.json();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/voucher-stats/${eventId}?tenant_id=${tenantData.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const stats = await response.json();
        setVoucherStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch voucher stats:", error);
    }
  }, [eventId, tenantSlug]);

  useEffect(() => {
    fetchItemAllocations();
    fetchVoucherAllocations();
    fetchInventoryItems();
    fetchVoucherStats();
  }, [fetchItemAllocations, fetchVoucherAllocations, fetchInventoryItems, fetchVoucherStats]);

  const handleSubmitItemAllocation = async () => {
    const validItems = itemFormData.items.filter(
      (item) => item.inventory_item_id && item.quantity_per_event
    );
    
    if (validItems.length === 0 || !itemFormData.category || !itemFormData.requested_email) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      const tenantData = await tenantResponse.json();
      const createdBy = localStorage.getItem("userEmail") || "admin";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/items?tenant_id=${tenantData.id}&created_by=${encodeURIComponent(createdBy)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            category: itemFormData.category,
            items: validItems.map((item) => ({
              inventory_item_id: parseInt(item.inventory_item_id),
              quantity_per_event: parseInt(item.quantity_per_event),
            })),
            notes: itemFormData.notes,
            requested_email: itemFormData.requested_email,
          }),
        }
      );

      if (response.ok) {
        await fetchItemAllocations();
        setShowItemForm(false);
        setItemFormData({
          category: "",
          items: [{ inventory_item_id: "", quantity_per_event: "" }],
          notes: "",
          requested_email: "",
        });

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "✅ Success!",
          description: `Item request sent to ${itemFormData.requested_email}`,
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to create item allocation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVoucherAllocation = async () => {
    if (!voucherFormData.drink_vouchers_per_participant) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Please enter number of vouchers per participant.",
        variant: "destructive",
      });
      return;
    }

    // Check if voucher allocation already exists
    if (voucherAllocations.length > 0) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Voucher allocation already exists. You can edit or delete the existing one.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      const tenantData = await tenantResponse.json();
      const createdBy = localStorage.getItem("userEmail") || "admin";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/vouchers?tenant_id=${tenantData.id}&created_by=${encodeURIComponent(createdBy)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            drink_vouchers_per_participant: parseInt(voucherFormData.drink_vouchers_per_participant),
            notes: voucherFormData.notes,
          }),
        }
      );

      if (response.ok) {
        await fetchVoucherAllocations();
        await fetchVoucherStats();
        setShowVoucherForm(false);
        setVoucherFormData({
          drink_vouchers_per_participant: "",
          notes: "",
        });

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "✅ Success!",
          description: "Voucher allocation created successfully.",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to create voucher allocation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItemAllocation = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/items/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchItemAllocations();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Deleted!",
          description: "Item allocation deleted successfully.",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to delete item allocation.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVoucherAllocation = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/vouchers/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchVoucherAllocations();
        await fetchVoucherStats();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Deleted!",
          description: "Voucher allocation deleted successfully.",
        });
      }
    } catch (error) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to delete voucher allocation.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.value === category);
    const IconComponent = categoryData?.icon || Package;
    return <IconComponent className="h-5 w-5" />;
  };

  const addItemToForm = () => {
    setItemFormData(prev => ({
      ...prev,
      items: [...prev.items, { inventory_item_id: "", quantity_per_event: "" }]
    }));
  };

  const removeItemFromForm = (index: number) => {
    setItemFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItemInForm = (index: number, field: string, value: string) => {
    setItemFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Event Allocations</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage items and voucher allocations for this event
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items ({itemAllocations.length})
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Wine className="h-4 w-4" />
            Vouchers ({voucherAllocations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Item Allocations</h4>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={itemViewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setItemViewMode('card')}
                  className={itemViewMode === 'card' ? 'h-8 px-3 bg-white shadow-sm' : 'h-8 px-3 hover:bg-gray-200'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={itemViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setItemViewMode('table')}
                  className={itemViewMode === 'table' ? 'h-8 px-3 bg-white shadow-sm' : 'h-8 px-3 hover:bg-gray-200'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={() => setShowItemForm(true)}
                disabled={eventHasEnded}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Items
              </Button>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Debug: {itemAllocations.length} item allocations found, View mode: {itemViewMode}
          </div>
          
          {itemAllocations.length > 0 ? (
            itemViewMode === 'table' ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemAllocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(allocation.inventory_item_category)}
                            <span className="font-medium">
                              {categories.find(cat => cat.value === allocation.inventory_item_category)?.label || allocation.inventory_item_category}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{allocation.inventory_item_name}</div>
                            <div className="text-sm text-gray-500">Qty: {allocation.quantity_per_event}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {allocation.created_by}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {allocation.requested_email || "Not assigned"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(allocation.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(allocation.status)}
                            {allocation.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItemId(allocation.id)}
                              disabled={eventHasEnded}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItemAllocation(allocation.id)}
                              disabled={eventHasEnded}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemAllocations.map((allocation) => (
                  <div key={allocation.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(allocation.inventory_item_category)}
                        <span className="text-sm font-medium text-gray-600">
                          {categories.find(cat => cat.value === allocation.inventory_item_category)?.label || allocation.inventory_item_category}
                        </span>
                      </div>
                      <Badge className={`${getStatusColor(allocation.status)} flex items-center gap-1`}>
                        {getStatusIcon(allocation.status)}
                        {allocation.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold text-gray-900">{allocation.inventory_item_name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {allocation.quantity_per_event}</p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Requested by:</span>
                        <span className="font-medium">{allocation.created_by}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Assigned to:</span>
                        <span className="font-medium">{allocation.requested_email || "Not assigned"}</span>
                      </div>
                    </div>
                    
                    {allocation.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{allocation.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItemId(allocation.id)}
                        disabled={eventHasEnded}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItemAllocation(allocation.id)}
                        disabled={eventHasEnded}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No item allocations</h4>
              <p className="text-gray-500 mb-4">Request items from team members for this event</p>
              <Button
                onClick={() => setShowItemForm(true)}
                disabled={eventHasEnded}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Items
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Voucher Allocations</h4>
            <Button
              onClick={() => {
                setShowVoucherForm(true);
                fetchVoucherStats();
              }}
              disabled={eventHasEnded || voucherAllocations.length > 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vouchers
            </Button>
          </div>

          {voucherStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Voucher Statistics</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Participants:</span>
                  <div className="font-semibold text-blue-900">{voucherStats.total_participants}</div>
                </div>
                <div>
                  <span className="text-blue-700">Allocated Vouchers:</span>
                  <div className="font-semibold text-blue-900">{voucherStats.total_allocated_vouchers}</div>
                </div>
                <div>
                  <span className="text-blue-700">Redeemed Vouchers:</span>
                  <div className="font-semibold text-blue-900">{voucherStats.total_redeemed_vouchers}</div>
                </div>
              </div>
            </div>
          )}

          {voucherAllocations.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vouchers per Participant</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voucherAllocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wine className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">{allocation.drink_vouchers_per_participant} vouchers</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {allocation.created_by}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(allocation.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(allocation.status)}
                          {allocation.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(allocation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingVoucherId(allocation.id)}
                            disabled={eventHasEnded}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVoucherAllocation(allocation.id)}
                            disabled={eventHasEnded}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Wine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No voucher allocations</h4>
              <p className="text-gray-500 mb-4">Add drink vouchers for event participants</p>
              <Button
                onClick={() => {
                  setShowVoucherForm(true);
                  fetchVoucherStats();
                }}
                disabled={eventHasEnded}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vouchers
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Request Form Dialog */}
      <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Select value={itemFormData.category} onValueChange={(value) => setItemFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Assign to Email *</label>
              <Input
                type="email"
                value={itemFormData.requested_email}
                onChange={(e) => setItemFormData(prev => ({ ...prev, requested_email: e.target.value }))}
                placeholder="Enter email address of person responsible"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Items *</label>
                <Button type="button" variant="outline" size="sm" onClick={addItemToForm}>
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>

              {itemFormData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-3 border rounded-md mb-2">
                  <Select
                    value={item.inventory_item_id}
                    onValueChange={(value) => updateItemInForm(index, "inventory_item_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems
                        .filter(invItem => !itemFormData.category || invItem.category === itemFormData.category)
                        .map((invItem) => (
                        <SelectItem key={invItem.id} value={invItem.id.toString()}>
                          {invItem.name} ({invItem.quantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity_per_event}
                      onChange={(e) => updateItemInForm(index, "quantity_per_event", e.target.value)}
                      placeholder="Quantity"
                    />
                    {itemFormData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItemFromForm(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Input
                value={itemFormData.notes}
                onChange={(e) => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitItemAllocation} disabled={loading}>
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voucher Form Dialog */}
      <Dialog open={showVoucherForm} onOpenChange={setShowVoucherForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Voucher Allocation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Vouchers per Participant *</label>
              <Input
                type="number"
                min="0"
                value={voucherFormData.drink_vouchers_per_participant}
                onChange={(e) => setVoucherFormData(prev => ({ ...prev, drink_vouchers_per_participant: e.target.value }))}
                placeholder="Enter number of vouchers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Input
                value={voucherFormData.notes}
                onChange={(e) => setVoucherFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoucherForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitVoucherAllocation} disabled={loading}>
              {loading ? "Creating..." : "Create Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}