"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedApi } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Send, Search, User, X } from "lucide-react";

interface User {
  email: string;
  name: string;
  role: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantSlug: string;
}

export default function NewMessageModal({ isOpen, onClose, onSuccess, tenantSlug }: NewMessageModalProps) {
  const { apiClient } = useAuthenticatedApi();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.request("/chat/users/", {
        headers: { 'X-Tenant-ID': tenantSlug }
      });
      setUsers(response as User[]);
      setFilteredUsers(response as User[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [apiClient, tenantSlug]);

  const sendMessage = async () => {
    if (!selectedUser || !message.trim() || sending) return;

    const payload = {
      recipient_email: selectedUser.email,
      message: message.trim(),
      tenant_id: tenantSlug.trim(),
      tenant_slug: tenantSlug.trim(),
      'X-Tenant-ID': tenantSlug.trim()
    };
    


    setSending(true);
    try {
      await apiClient.request("/chat/direct-messages/", {
        method: "POST",
        headers: { 
          'X-Tenant-ID': tenantSlug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Trigger notification refresh events
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      window.dispatchEvent(new CustomEvent('chatMessageSent'));
      
      toast({ title: "Success", description: "Message sent successfully" });
      onSuccess();
      

    } catch (error: unknown) {
      console.error("Error sending message:", error);
      
      let errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to send message";
      
      if (errorMessage.includes('tenant_id') && errorMessage.includes('null value')) {
        errorMessage = "Unable to send message due to a backend configuration issue. Please contact your system administrator.";
        console.error('Backend tenant_id extraction issue detected');
      }
      
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSelectedUser(null);
      setMessage("");
      setSearchTerm("");
    }
  }, [isOpen, fetchUsers]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'MT_ADMIN':
      case 'HR_ADMIN':
      case 'EVENT_ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'MT_ADMIN':
        return 'MT Admin';
      case 'HR_ADMIN':
        return 'HR Admin';
      case 'EVENT_ADMIN':
        return 'Event Admin';
      default:
        return role.replace('_', ' ');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedUser ? (
            <>
              <div>
                <Label htmlFor="search">Select Recipient</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {users.length === 0 ? "No users available" : "No matching users found"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.email}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={getRoleColor(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>Recipient</Label>
                <div className="mt-1 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{selectedUser.name}</div>
                      <div className="text-sm text-gray-600">{selectedUser.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || sending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}