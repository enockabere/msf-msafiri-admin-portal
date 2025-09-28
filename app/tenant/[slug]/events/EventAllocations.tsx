"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  RotateCcw,
  Send,
  Trash2,
  ChevronDown,
  ChevronRight,
  Mail,
  Laptop,
  Wrench,
} from "lucide-react";

interface Allocation {
  id: number;
  inventory_item_id: number;
  inventory_item_name: string;
  inventory_item_category: string;
  quantity_per_participant: number;
  drink_vouchers_per_participant: number;
  available_quantity: number;
  status: string;
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  items?: {
    inventory_item_id: number;
    quantity_per_participant: number;
  }[];
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
}

export default function EventAllocations({
  eventId,
  tenantSlug,
}: EventAllocationsProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    items: [] as {
      inventory_item_id: string;
      quantity_per_event: string;
    }[],
    drink_vouchers_per_participant: "",
    notes: "",
  });
  const [allocationType, setAllocationType] = useState<"items" | "vouchers">("items");
  const [newItemAllocation, setNewItemAllocation] = useState({
    items: [{ inventory_item_id: "", quantity_per_event: "" }] as {
      inventory_item_id: string;
      quantity_per_event: string;
    }[],
    notes: "",
  });
  const [newVoucherAllocation, setNewVoucherAllocation] = useState({
    drink_vouchers_per_participant: "",
    notes: "",
  });
  const [expandedAllocations, setExpandedAllocations] = useState<number[]>([]);
  const [voucherStats, setVoucherStats] = useState<{
    total_participants: number;
    total_allocated_vouchers: number;
    total_redeemed_vouchers: number;
    over_allocated_participants: number;
  } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [requestEmail, setRequestEmail] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);


  const fetchAllocations = useCallback(async () => {
    try {
      // Get tenant ID from slug first
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!tenantResponse.ok) {
        console.error("Failed to get tenant ID");
        return;
      }
      
      const tenantData = await tenantResponse.json();
      const tenantId = tenantData.id;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/event/${eventId}?tenant_id=${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAllocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch allocations:", error);
    }
  }, [eventId, tenantSlug]);

  const fetchInventoryItems = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/inventory/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'X-Tenant-ID': tenantSlug
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
    }
  }, [tenantSlug]);

  useEffect(() => {
    fetchAllocations();
    fetchInventoryItems();
  }, [fetchAllocations, fetchInventoryItems]);

  const addInventoryItem = () => {
    setNewItemAllocation((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { inventory_item_id: "", quantity_per_event: "" },
      ],
    }));
  };

  const fetchVoucherStats = async (eventId: number) => {
    try {
      // Get tenant ID from slug first
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!tenantResponse.ok) {
        console.error("Failed to get tenant ID");
        return;
      }
      
      const tenantData = await tenantResponse.json();
      const tenantId = tenantData.id;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/voucher-stats/${eventId}?tenant_id=${tenantId}`,
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
  };

  const removeInventoryItem = (index: number) => {
    setNewItemAllocation((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateInventoryItem = (index: number, field: string, value: string) => {
    setNewItemAllocation((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };





  const handleSubmitAllocation = async (asDraft = false) => {
    // Validate based on allocation type
    if (allocationType === "items") {
      const validItems = newItemAllocation.items.filter(
        (item) => item.inventory_item_id && item.quantity_per_event
      );
      if (validItems.length === 0) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Please add at least one item.",
          variant: "destructive",
        });
        return;
      }
    } else if (allocationType === "vouchers") {
      if (!newVoucherAllocation.drink_vouchers_per_participant) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Please enter number of vouchers per participant.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Get tenant ID from slug first
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!tenantResponse.ok) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Failed to get tenant information.",
          variant: "destructive",
        });
        return;
      }
      
      const tenantData = await tenantResponse.json();
      const tenantId = tenantData.id;
      const createdBy = localStorage.getItem("userEmail") || "admin";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/?tenant_id=${tenantId}&created_by=${encodeURIComponent(createdBy)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            items: allocationType === "items" ? newItemAllocation.items
              .filter(item => item.inventory_item_id && item.quantity_per_event)
              .map((item) => ({
                inventory_item_id: parseInt(item.inventory_item_id),
                quantity_per_event: parseInt(item.quantity_per_event),
              })) : [],
            drink_vouchers_per_participant: allocationType === "vouchers" 
              ? parseInt(newVoucherAllocation.drink_vouchers_per_participant) || 0 
              : 0,
            notes: allocationType === "items" ? newItemAllocation.notes : newVoucherAllocation.notes,
            status: asDraft ? "open" : "pending"
          }),
        }
      );

      if (response.ok) {
        await fetchAllocations();
        
        // Clear only the current form type, keep the form open
        if (allocationType === "items") {
          setNewItemAllocation({
            items: [{ inventory_item_id: "", quantity_per_event: "" }],
            notes: "",
          });
        } else {
          setNewVoucherAllocation({
            drink_vouchers_per_participant: "",
            notes: "",
          });
        }

        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "✅ Success!",
          description: `${allocationType === "items" ? "Items" : "Vouchers"} allocation saved successfully. You can now switch tabs to add ${allocationType === "items" ? "vouchers" : "items"}.`,
        });
      } else {
        const errorData = await response.json();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: errorData.detail || "Failed to create allocation.",
          variant: "destructive",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to create allocation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAllocation = async (allocationId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/${allocationId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchAllocations();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Cancelled!",
          description: "Allocation cancelled and available for editing.",
        });
      } else {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Failed to cancel allocation.",
          variant: "destructive",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to cancel allocation.",
        variant: "destructive",
      });
    }
  };

  const handleEditAllocation = (allocation: Allocation) => {
    setEditingId(allocation.id);
    setEditData({
      items: allocation.items?.map((item: { inventory_item_id: number; quantity_per_participant: number }) => ({
        inventory_item_id: item.inventory_item_id.toString(),
        quantity_per_event: item.quantity_per_participant.toString(),
      })) || [{ 
        inventory_item_id: allocation.inventory_item_id.toString(), 
        quantity_per_event: allocation.quantity_per_participant.toString() 
      }],
      drink_vouchers_per_participant:
        allocation.drink_vouchers_per_participant?.toString() || "0",
      notes: allocation.notes || "",
    });
  };

  const handleUpdateAllocation = async (allocationId: number) => {
    setLoading(true);
    try {
      const validItems = editData.items.filter(
        (item) => item.inventory_item_id && item.quantity_per_event
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/${allocationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            items: validItems.map((item) => ({
              inventory_item_id: parseInt(item.inventory_item_id),
              quantity_per_event: parseInt(item.quantity_per_event),
            })),
            drink_vouchers_per_participant:
              parseInt(editData.drink_vouchers_per_participant) || 0,
            notes: editData.notes,
          }),
        }
      );

      if (response.ok) {
        await fetchAllocations();
        setEditingId(null);
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Updated!",
          description: "Allocation updated successfully.",
        });
      } else {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Failed to update allocation.",
          variant: "destructive",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to update allocation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitAllocation = async (allocationId: number) => {
    setLoading(true);
    try {
      // Get tenant ID from slug
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const tenantData = await tenantResponse.json();
      const tenantId = tenantData.id;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/${allocationId}/resubmit?tenant_id=${tenantId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchAllocations();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "🚀 Resubmitted!",
          description:
            "Allocation resubmitted for HR approval. Notification sent to HR Admin.",
        });
      } else {
        const errorData = await response.json();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: errorData.detail || "Failed to resubmit allocation.",
          variant: "destructive",
        });
      }
    } catch{
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to resubmit allocation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllocation = async (allocationId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/${allocationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        await fetchAllocations();
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Deleted!",
          description: "Allocation deleted successfully.",
        });
      } else {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Error!",
          description: "Failed to delete allocation.",
          variant: "destructive",
        });
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to delete allocation.",
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
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
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
    switch (category) {
      case "ict_equipment":
        return <Laptop className="h-5 w-5" />;
      case "equipment":
        return <Wrench className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const groupAllocationsByCategory = () => {
    const grouped: { [key: string]: Allocation[] } = {};
    
    allocations.forEach(allocation => {
      const category = allocation.inventory_item_category || "stationary";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(allocation);
    });
    
    return grouped;
  };

  const handleSendRequest = async () => {
    if (!requestEmail || !selectedCategory) return;
    
    setSendingRequest(true);
    try {
      // Get tenant ID from slug first
      const tenantResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/slug/${tenantSlug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!tenantResponse.ok) {
        throw new Error("Failed to get tenant information");
      }
      
      const tenantData = await tenantResponse.json();
      const tenantId = tenantData.id;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/allocations/request-items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            category: selectedCategory,
            email: requestEmail,
            tenant_id: tenantId
          }),
        }
      );

      if (response.ok) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "✅ Request Sent!",
          description: `Item request for ${selectedCategory} category sent to ${requestEmail}`,
        });
        setShowEmailModal(false);
        setRequestEmail("");
        setSelectedCategory("");
      } else {
        throw new Error("Failed to send request");
      }
    } catch {
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Error!",
        description: "Failed to send item request",
        variant: "destructive",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Event Allocations</h3>
          <p className="text-sm text-gray-600 mt-1">
            {allocations.length} allocation requests
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Allocation
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 space-y-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              <h4 className="text-lg font-semibold text-gray-900">
                Add New Allocation
              </h4>
            </div>
            <div className="flex gap-2">
              <Button
                variant={allocationType === "items" ? "default" : "outline"}
                size="sm"
                onClick={() => setAllocationType("items")}
                className={allocationType === "items" ? "bg-red-600 text-white" : ""}
              >
                Items
              </Button>
              <Button
                variant={allocationType === "vouchers" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAllocationType("vouchers");
                  fetchVoucherStats(eventId);
                }}
                className={allocationType === "vouchers" ? "bg-red-600 text-white" : ""}
              >
                Drink Vouchers
              </Button>
            </div>
          </div>
          {allocationType === "items" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Inventory Items *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInventoryItem}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>

              {newItemAllocation.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md"
                >
                  <div className="space-y-2">
                    <Select
                      value={item.inventory_item_id}
                      onValueChange={(value) =>
                        updateInventoryItem(index, "inventory_item_id", value)
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder="Select inventory item" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                        {inventoryItems.map((invItem) => (
                          <SelectItem
                            key={invItem.id}
                            value={invItem.id.toString()}
                            className="hover:bg-red-50 focus:bg-red-50"
                          >
                            {invItem.name} ({invItem.quantity} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity_per_event}
                      onChange={(e) =>
                        updateInventoryItem(
                          index,
                          "quantity_per_event",
                          e.target.value
                        )
                      }
                      placeholder="Total quantity for event"
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    {newItemAllocation.items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInventoryItem(index)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <Input
                  value={newItemAllocation.notes}
                  onChange={(e) =>
                    setNewItemAllocation({ ...newItemAllocation, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {allocationType === "vouchers" && (
            <div className="space-y-4">
              {voucherStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Voucher Statistics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    <div>
                      <span className="text-blue-700">Over-allocated:</span>
                      <div className="font-semibold text-blue-900">{voucherStats.over_allocated_participants}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Drink Vouchers per Participant *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={newVoucherAllocation.drink_vouchers_per_participant}
                  onChange={(e) =>
                    setNewVoucherAllocation({
                      ...newVoucherAllocation,
                      drink_vouchers_per_participant: e.target.value,
                    })
                  }
                  placeholder="Enter number of vouchers"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <Input
                  value={newVoucherAllocation.notes}
                  onChange={(e) =>
                    setNewVoucherAllocation({ ...newVoucherAllocation, notes: e.target.value })
                  }
                  placeholder="Additional notes"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleSubmitAllocation(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewItemAllocation({
                  items: [
                    { inventory_item_id: "", quantity_per_event: "" },
                  ],
                  notes: "",
                });
                setNewVoucherAllocation({
                  drink_vouchers_per_participant: "",
                  notes: "",
                });
                setVoucherStats(null);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Request Items - {selectedCategory}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSendRequest}
                  disabled={!requestEmail || sendingRequest}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  {sendingRequest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailModal(false);
                    setRequestEmail("");
                    setSelectedCategory("");
                  }}
                  disabled={sendingRequest}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupAllocationsByCategory()).map(([category, categoryAllocations]) => (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(category)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {category === "ict_equipment" ? "ICT Equipment/Items" : 
                     category === "equipment" ? "Equipment" : "Stationary"}
                  </h4>
                  <p className="text-sm text-gray-600">{categoryAllocations.length} allocations</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedCategory(category);
                  setShowEmailModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                <Mail className="h-4 w-4 mr-2" />
                Request
              </Button>
            </div>
            
            <div className="space-y-3">
              {categoryAllocations.map((allocation) => (
          <div
            key={allocation.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200"
          >
            {editingId === allocation.id ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-gray-900">
                    Editing: {allocation.inventory_item_name}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Items
                    </label>
                    {editData.items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md mb-2"
                      >
                        <div>
                          <Select
                            value={item.inventory_item_id}
                            onValueChange={(value) => {
                              const newItems = [...editData.items];
                              newItems[index].inventory_item_id = value;
                              setEditData({ ...editData, items: newItems });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select inventory item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((invItem) => (
                                <SelectItem
                                  key={invItem.id}
                                  value={invItem.id.toString()}
                                >
                                  {invItem.name} ({invItem.quantity} available)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity_per_event}
                            onChange={(e) => {
                              const newItems = [...editData.items];
                              newItems[index].quantity_per_event =
                                e.target.value;
                              setEditData({ ...editData, items: newItems });
                            }}
                            placeholder="Total quantity"
                          />
                          {editData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newItems = editData.items.filter(
                                  (_, i) => i !== index
                                );
                                setEditData({ ...editData, items: newItems });
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditData({
                          ...editData,
                          items: [
                            ...editData.items,
                            {
                              inventory_item_id: "",
                              quantity_per_event: "",
                            },
                          ],
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Drink Vouchers
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editData.drink_vouchers_per_participant}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            drink_vouchers_per_participant: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <Input
                        value={editData.notes}
                        onChange={(e) =>
                          setEditData({ ...editData, notes: e.target.value })
                        }
                        placeholder="Additional notes"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUpdateAllocation(allocation.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={async () => {
                      await handleUpdateAllocation(allocation.id);
                      if (
                        allocation.status === "open" ||
                        allocation.status === "draft"
                      ) {
                        await handleResubmitAllocation(allocation.id);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={loading}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Submit for Approval
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingId(null)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {allocation.inventory_item_name}
                      </span>
                      <Badge
                        className={`text-xs px-2 py-0.5 ${getStatusColor(
                          allocation.status
                        )} flex items-center gap-1`}
                      >
                        {getStatusIcon(allocation.status)}
                        {allocation.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      {allocation.drink_vouchers_per_participant > 0 && (
                        <div>
                          <span className="font-medium">Drinks:</span>{" "}
                          {allocation.drink_vouchers_per_participant} vouchers per person
                        </div>
                      )}
                      {allocation.items && allocation.items.length > 0 && (
                        <div>
                          <span className="font-medium">Items:</span>{" "}
                          {allocation.items.length} item types
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Requested by:</span>{" "}
                        {allocation.created_by}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const isExpanded = expandedAllocations.includes(allocation.id);
                        if (isExpanded) {
                          setExpandedAllocations(prev => prev.filter(id => id !== allocation.id));
                        } else {
                          setExpandedAllocations(prev => [...prev, allocation.id]);
                        }
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      {expandedAllocations.includes(allocation.id) ? (
                        <><ChevronDown className="h-4 w-4 mr-1" />Hide Items</>
                      ) : (
                        <><ChevronRight className="h-4 w-4 mr-1" />Show Items</>
                      )}
                    </Button>
                    {expandedAllocations.includes(allocation.id) && (
                      <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
                        {allocation.items?.map((item: Record<string, unknown>, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{String(item.inventory_item_name)}</span>
                            <div className="text-right">
                              <span className="text-gray-600">Total: {String(item.quantity_per_event || item.quantity_per_participant)}</span>
                              <br />
                              <span className="text-xs text-gray-500">Available: {String(item.available_quantity)}</span>
                            </div>
                          </div>
                        )) || (
                          <div className="text-sm text-gray-500">No items allocated</div>
                        )}
                      </div>
                    )}
                    {allocation.notes && (
                      <div className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                        {allocation.notes}
                      </div>
                    )}
                    {allocation.status === "pending" && (
                      <div className="text-sm text-orange-700 mt-2 bg-orange-50 border border-orange-200 p-2 rounded flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Awaiting HR Admin approval</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {allocation.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelAllocation(allocation.id)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {(allocation.status === "open" ||
                    allocation.status === "draft" ||
                    allocation.status === "rejected") && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAllocation(allocation)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {allocation.status === "rejected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleResubmitAllocation(allocation.id)
                          }
                          className="border-green-300 text-green-700 hover:bg-green-50"
                          disabled={loading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAllocation(allocation.id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
              ))}
            </div>
          </div>
        ))}

        {allocations.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No allocations yet
              </h4>
              <p className="text-gray-500 mb-4">
                Allocate resources for attending participants
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Allocation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
