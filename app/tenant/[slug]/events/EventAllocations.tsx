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

interface VoucherScanner {
  id: number;
  email: string;
  name?: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

interface ParticipantRedemption {
  user_id: number;
  participant_name: string;
  participant_email: string;
  allocated_count: number;
  redeemed_count: number;
  last_redemption_date?: string;
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
  const [voucherAllocations, setVoucherAllocations] = useState<
    VoucherAllocation[]
  >([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [scanners, setScanners] = useState<VoucherScanner[]>([]);
  const [participantRedemptions, setParticipantRedemptions] = useState<ParticipantRedemption[]>([
    // Mock data for demonstration - remove when backend is connected
    {
      user_id: 1,
      participant_name: "John Doe",
      participant_email: "john.doe@msf.org",
      allocated_count: 3,
      redeemed_count: 2,
      last_redemption_date: "2024-11-10T14:30:00Z"
    },
    {
      user_id: 2,
      participant_name: "Jane Smith",
      participant_email: "jane.smith@msf.org",
      allocated_count: 3,
      redeemed_count: 5, // Over-redeemed
      last_redemption_date: "2024-11-11T09:15:00Z"
    },
    {
      user_id: 3,
      participant_name: "Mike Johnson",
      participant_email: "mike.johnson@msf.org",
      allocated_count: 3,
      redeemed_count: 3, // Fully used
      last_redemption_date: "2024-11-11T10:45:00Z"
    },
    {
      user_id: 4,
      participant_name: "Sarah Wilson",
      participant_email: "sarah.wilson@msf.org",
      allocated_count: 3,
      redeemed_count: 0, // Not used
      last_redemption_date: null
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [itemViewMode, setItemViewMode] = useState<"card" | "table">("table");
  const [, setEditingItemId] = useState<number | null>(null);
  const [, setEditingVoucherId] = useState<number | null>(null);

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

  // Scanner form
  const [showScannerForm, setShowScannerForm] = useState(false);
  const [scannerFormData, setScannerFormData] = useState({
    email: "",
    name: "",
  });

  // Stats
  const [voucherStats, setVoucherStats] = useState<{
    total_participants: number;
    total_allocated_vouchers: number;
    total_redeemed_vouchers: number;
  } | null>({
    // Mock data for demonstration - remove when backend is connected
    total_participants: 4,
    total_allocated_vouchers: 12,
    total_redeemed_vouchers: 10
  });

  const categories = [
    { value: "stationary", label: "Stationery", icon: FileText },
    { value: "ict_equipment", label: "ICT Equipment", icon: Laptop },
    { value: "equipment", label: "Equipment", icon: Wrench },
  ];

  const fetchItemAllocations = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
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
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/?tenant=${tenantSlug}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
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

  const fetchScanners = useCallback(async () => {
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voucher-scanners/event/${eventId}?tenant_id=${tenantData.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setScanners(data);
      }
    } catch (error) {
      console.error("Failed to fetch scanners:", error);
    }
  }, [eventId, tenantSlug]);

  const fetchParticipantRedemptions = useCallback(async () => {
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voucher-redemptions/event/${eventId}/participants?tenant_id=${tenantData.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setParticipantRedemptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch participant redemptions:", error);
    }
  }, [eventId, tenantSlug]);

  useEffect(() => {
    fetchItemAllocations();
    fetchVoucherAllocations();
    fetchInventoryItems();
    fetchVoucherStats();
    fetchScanners();
    fetchParticipantRedemptions();
  }, [
    fetchItemAllocations,
    fetchVoucherAllocations,
    fetchInventoryItems,
    fetchVoucherStats,
    fetchScanners,
    fetchParticipantRedemptions,
  ]);

  const handleSubmitItemAllocation = async () => {
    const validItems = itemFormData.items.filter(
      (item) => item.inventory_item_id && item.quantity_per_event
    );

    if (
      validItems.length === 0 ||
      !itemFormData.category ||
      !itemFormData.requested_email
    ) {
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
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/v1/allocations/items?tenant_id=${
          tenantData.id
        }&created_by=${encodeURIComponent(createdBy)}`,
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
    } catch {
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
        description:
          "Voucher allocation already exists. You can edit or delete the existing one.",
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
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/v1/allocations/vouchers?tenant_id=${
          tenantData.id
        }&created_by=${encodeURIComponent(createdBy)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            drink_vouchers_per_participant: parseInt(
              voucherFormData.drink_vouchers_per_participant
            ),
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
    } catch {
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
    } catch {
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
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to delete voucher allocation.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitScanner = async () => {
    if (!scannerFormData.email) {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Please enter scanner email address.",
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voucher-scanners?tenant_id=${tenantData.id}&created_by=${encodeURIComponent(createdBy)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            email: scannerFormData.email,
            name: scannerFormData.name,
          }),
        }
      );

      if (response.ok) {
        await fetchScanners();
        setShowScannerForm(false);
        setScannerFormData({ email: "", name: "" });

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "✅ Success!",
          description: `Scanner account created for ${scannerFormData.email}`,
        });
      } else {
        const errorData = await response.json();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: errorData.message || "Failed to create scanner account.",
          variant: "destructive",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to create scanner account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleScannerStatus = async (scannerId: number, isActive: boolean) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voucher-scanners/${scannerId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ is_active: isActive }),
        }
      );

      if (response.ok) {
        await fetchScanners();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Updated!",
          description: `Scanner ${isActive ? "activated" : "deactivated"} successfully.`,
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to update scanner status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScanner = async (scannerId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/voucher-scanners/${scannerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchScanners();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Deleted!",
          description: "Scanner account deleted successfully.",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to delete scanner account.",
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
    const categoryData = categories.find((cat) => cat.value === category);
    const IconComponent = categoryData?.icon || Package;
    return <IconComponent className="h-5 w-5" />;
  };

  const addItemToForm = () => {
    setItemFormData((prev) => ({
      ...prev,
      items: [...prev.items, { inventory_item_id: "", quantity_per_event: "" }],
    }));
  };

  const removeItemFromForm = (index: number) => {
    setItemFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemInForm = (index: number, field: string, value: string) => {
    setItemFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
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
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="items" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600 data-[state=active]:border-red-200 transition-all duration-200"
          >
            <Package className="h-4 w-4" />
            Items ({itemAllocations.length})
          </TabsTrigger>
          <TabsTrigger 
            value="vouchers" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600 data-[state=active]:border-red-200 transition-all duration-200"
          >
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
                  variant={itemViewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setItemViewMode("card")}
                  className={
                    itemViewMode === "card"
                      ? "h-8 px-3 bg-white shadow-sm"
                      : "h-8 px-3 hover:bg-gray-200"
                  }
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={itemViewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setItemViewMode("table")}
                  className={
                    itemViewMode === "table"
                      ? "h-8 px-3 bg-white shadow-sm"
                      : "h-8 px-3 hover:bg-gray-200"
                  }
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
            Debug: {itemAllocations.length} item allocations found, View mode:{" "}
            {itemViewMode}
          </div>

          {itemAllocations.length > 0 ? (
            itemViewMode === "table" ? (
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
                    {itemAllocations.map((allocation, index) => (
                      <TableRow key={`table-allocation-${allocation.id}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(
                              allocation.inventory_item_category
                            )}
                            <span className="font-medium">
                              {categories.find(
                                (cat) =>
                                  cat.value ===
                                  allocation.inventory_item_category
                              )?.label || allocation.inventory_item_category}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {allocation.inventory_item_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Qty: {allocation.quantity_per_event}
                            </div>
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
                          <Badge
                            className={`${getStatusColor(
                              allocation.status
                            )} flex items-center gap-1 w-fit`}
                          >
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
                              onClick={() =>
                                handleDeleteItemAllocation(allocation.id)
                              }
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
                {itemAllocations.map((allocation, index) => (
                  <div
                    key={`card-allocation-${allocation.id}-${index}`}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(allocation.inventory_item_category)}
                        <span className="text-sm font-medium text-gray-600">
                          {categories.find(
                            (cat) =>
                              cat.value === allocation.inventory_item_category
                          )?.label || allocation.inventory_item_category}
                        </span>
                      </div>
                      <Badge
                        className={`${getStatusColor(
                          allocation.status
                        )} flex items-center gap-1`}
                      >
                        {getStatusIcon(allocation.status)}
                        {allocation.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold text-gray-900">
                        {allocation.inventory_item_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {allocation.quantity_per_event}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Requested by:</span>
                        <span className="font-medium">
                          {allocation.created_by}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Assigned to:</span>
                        <span className="font-medium">
                          {allocation.requested_email || "Not assigned"}
                        </span>
                      </div>
                    </div>

                    {allocation.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {allocation.notes}
                        </p>
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
                        onClick={() =>
                          handleDeleteItemAllocation(allocation.id)
                        }
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No item allocations
              </h4>
              <p className="text-gray-500 mb-4">
                Request items from team members for this event
              </p>
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
            <h4 className="text-lg font-semibold">Voucher Management</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowScannerForm(true)}
                disabled={eventHasEnded}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <User className="h-4 w-4 mr-2" />
                Add Scanner
              </Button>
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
          </div>

          {/* Scanner Management Section */}
          {scanners && scanners.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Voucher Scanners ({scanners.length})
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scanners.map((scanner, index) => (
                  <div key={`scanner-${scanner.id}-${index}`} className="bg-white border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{scanner.name || scanner.email}</div>
                          <div className="text-xs text-gray-500">{scanner.email}</div>
                        </div>
                      </div>
                      <Badge className={scanner.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {scanner.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      Created: {new Date(scanner.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleScannerStatus(scanner.id, !scanner.is_active)}
                        className="flex-1 text-xs"
                      >
                        {scanner.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteScanner(scanner.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voucher Statistics */}
          {voucherStats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Wine className="h-4 w-4" />
                Voucher Statistics
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <span className="text-green-700 block">Total Participants:</span>
                  <div className="font-semibold text-green-900 text-lg">
                    {voucherStats.total_participants || 0}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-green-700 block">Allocated Vouchers:</span>
                  <div className="font-semibold text-green-900 text-lg">
                    {voucherStats.total_allocated_vouchers || 0}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-green-700 block">Redeemed Vouchers:</span>
                  <div className="font-semibold text-green-900 text-lg">
                    {voucherStats.total_redeemed_vouchers || 0}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-green-700 block">Remaining:</span>
                  <div className="font-semibold text-green-900 text-lg">
                    {(voucherStats.total_allocated_vouchers || 0) - (voucherStats.total_redeemed_vouchers || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Participant Redemption Tracking */}
          {participantRedemptions && participantRedemptions.length > 0 && (
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h5 className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Participant Voucher Tracking ({participantRedemptions.length})
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor voucher usage and identify over-redemptions
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Redeemed</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Redemption</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantRedemptions.map((participant, index) => {
                      const isOverRedeemed = (participant.redeemed_count || 0) > (participant.allocated_count || 0);
                      const balance = (participant.allocated_count || 0) - (participant.redeemed_count || 0);
                      
                      return (
                        <TableRow key={`participant-${participant.user_id}-${index}`} className={isOverRedeemed ? "bg-red-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium">{participant.participant_name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">ID: {participant.user_id || 'N/A'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{participant.participant_email || 'No email'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {participant.allocated_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={isOverRedeemed ? "bg-red-100 text-red-700" : "bg-green-50 text-green-700"}>
                              {participant.redeemed_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={balance < 0 ? "bg-red-100 text-red-800" : balance === 0 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                              {balance || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isOverRedeemed ? (
                              <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                Over-redeemed
                              </Badge>
                            ) : balance === 0 ? (
                              <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Fully Used
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {participant.last_redemption_date 
                                ? new Date(participant.last_redemption_date).toLocaleString()
                                : "Never"
                              }
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
                  {voucherAllocations.map((allocation, index) => (
                    <TableRow key={`voucher-allocation-${allocation.id}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wine className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">
                            {allocation.drink_vouchers_per_participant} vouchers
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {allocation.created_by}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(
                            allocation.status
                          )} flex items-center gap-1 w-fit`}
                        >
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
                            onClick={() =>
                              handleDeleteVoucherAllocation(allocation.id)
                            }
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No voucher allocations
              </h4>
              <p className="text-gray-500 mb-4">
                Add drink vouchers for event participants
              </p>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-50">
          <DialogHeader className="bg-white p-6 -m-6 mb-4 rounded-t-lg border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">Request Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category *
              </label>
              <Select
                value={itemFormData.category}
                onValueChange={(value) =>
                  setItemFormData((prev) => ({ ...prev, category: value }))
                }
              >
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
              <label className="block text-sm font-medium mb-2">
                Assign to Email *
              </label>
              <Input
                type="email"
                value={itemFormData.requested_email}
                onChange={(e) =>
                  setItemFormData((prev) => ({
                    ...prev,
                    requested_email: e.target.value,
                  }))
                }
                placeholder="Enter email address of person responsible"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Items *</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemToForm}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>

              {itemFormData.items.map((item, index) => (
                <div
                  key={`item-form-${index}`}
                  className="grid grid-cols-2 gap-4 p-3 border rounded-md mb-2"
                >
                  <Select
                    value={item.inventory_item_id}
                    onValueChange={(value) =>
                      updateItemInForm(index, "inventory_item_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems
                        .filter(
                          (invItem) =>
                            !itemFormData.category ||
                            invItem.category === itemFormData.category
                        )
                        .map((invItem) => (
                          <SelectItem
                            key={`inv-${invItem.id}-${index}`}
                            value={invItem.id.toString()}
                          >
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
                      onChange={(e) =>
                        updateItemInForm(
                          index,
                          "quantity_per_event",
                          e.target.value
                        )
                      }
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
                onChange={(e) =>
                  setItemFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter className="bg-white p-6 -m-6 mt-4 rounded-b-lg border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowItemForm(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitItemAllocation} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scanner Form Dialog */}
      <Dialog open={showScannerForm} onOpenChange={setShowScannerForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-gray-50">
          <DialogHeader className="bg-white p-6 -m-6 mb-4 rounded-t-lg border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">Add Voucher Scanner</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Create a scanner account for voucher redemption. If the email doesn't exist, a new user will be created.
            </p>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div>
              <label className="block text-sm font-medium mb-2">
                Scanner Email *
              </label>
              <Input
                type="email"
                value={scannerFormData.email}
                onChange={(e) =>
                  setScannerFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Enter scanner's email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Scanner Name
              </label>
              <Input
                value={scannerFormData.name}
                onChange={(e) =>
                  setScannerFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter scanner's full name (optional)"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h6 className="font-medium text-blue-900 mb-2">Scanner Permissions</h6>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Can scan and redeem participant vouchers</li>
                <li>• Can view voucher balances</li>
                <li>• Cannot modify allocations or settings</li>
                <li>• Access limited to this event only</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="bg-white p-6 -m-6 mt-4 rounded-b-lg border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowScannerForm(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitScanner} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create Scanner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voucher Form Dialog */}
      <Dialog open={showVoucherForm} onOpenChange={setShowVoucherForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-gray-50">
          <DialogHeader className="bg-white p-6 -m-6 mb-4 rounded-t-lg border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">Add Voucher Allocation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div>
              <label className="block text-sm font-medium mb-2">
                Vouchers per Participant *
              </label>
              <Input
                type="number"
                min="0"
                value={voucherFormData.drink_vouchers_per_participant}
                onChange={(e) =>
                  setVoucherFormData((prev) => ({
                    ...prev,
                    drink_vouchers_per_participant: e.target.value,
                  }))
                }
                placeholder="Enter number of vouchers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Input
                value={voucherFormData.notes}
                onChange={(e) =>
                  setVoucherFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter className="bg-white p-6 -m-6 mt-4 rounded-b-lg border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowVoucherForm(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitVoucherAllocation} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Creating..." : "Create Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
