"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuthenticatedApi } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Users, CheckCircle, Edit, X } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";

interface VettingCommittee {
  id: number;
  event_id: number;
  committee_name?: string;
  approver_email: string;
  selection_start_date: string;
  selection_end_date: string;
  members: Array<{
    email: string;
    full_name: string;
  }>;
  status: string;
  submitted_at?: string;
  approved_at?: string;
}

export default function VettingCommitteePage() {
  const params = useParams();
  const { apiClient } = useAuthenticatedApi();
  const [committee, setCommittee] = useState<VettingCommittee | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    approver_email: "",
    selection_start_date: "",
    selection_end_date: "",
    members: [{ email: "", full_name: "" }]
  });
  const [eventName, setEventName] = useState("");
  const [eventData, setEventData] = useState<any>(null);

  const eventId = params.eventId as string;

  useEffect(() => {
    loadCommittee();
    loadEventName();
  }, [eventId]);

  const loadCommittee = async () => {
    try {
      const response = await apiClient.request<VettingCommittee>(`/vetting-committee/event/${eventId}`);


      setCommittee(response);
    } catch (error: any) {
      console.log("No committee found or access denied - will show create form");
      setCommittee(null);
    } finally {
      setLoading(false);
    }
  };

  const loadEventName = async () => {
    try {
      const response = await apiClient.request(`/events/${eventId}`);
      setEventName(response.title || "Event");
      setEventData(response);
    } catch (error) {
      setEventName("Event");
      setEventData(null);
    }
  };

  const getDateConstraints = () => {
    if (!eventData) return { minStart: '', maxStart: '', minEnd: '', maxEnd: '' };
    
    // Check multiple possible field names for registration start
    const registrationStart = eventData.registration_start_date || eventData.registration_deadline || eventData.created_at;
    const eventStart = eventData.start_date;
    const today = new Date().toISOString().split('T')[0];
    
    const minStartDate = registrationStart ? new Date(registrationStart).toISOString().split('T')[0] : today;
    const maxStartDate = eventStart ? new Date(eventStart).toISOString().split('T')[0] : '';
    const selectionStart = formData.selection_start_date;
    
    return {
      minStart: minStartDate,
      maxStart: maxStartDate,
      minEnd: selectionStart || minStartDate,
      maxEnd: maxStartDate
    };
  };

  const addMemberField = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { email: "", full_name: "" }]
    }));
  };

  const removeMemberField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  const updateMember = (index: number, field: 'email' | 'full_name', value: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const deleteCommittee = async () => {
    const result = await Swal.fire({
      title: 'Delete Vetting Committee?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    
    try {
      await apiClient.request(`/vetting-committee/${committee?.id}`, {
        method: "DELETE"
      });
      setCommittee(null);
      toast.success("Vetting committee deleted successfully");
    } catch (error) {
      toast.error("Failed to delete vetting committee");
    }
  };

  const createCommittee = async () => {
    if (!formData.approver_email || !formData.selection_start_date || !formData.selection_end_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const validMembers = formData.members.filter(member => member.email.trim());
    if (validMembers.length === 0) {
      toast.error("Please add at least one committee member");
      return;
    }

    setCreating(true);
    try {
      const url = isEditing ? `/vetting-committee/${committee?.id}` : "/vetting-committee/";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await apiClient.request(url, {
        method,
        body: JSON.stringify({
          event_id: parseInt(eventId),
          selection_start_date: new Date(formData.selection_start_date).toISOString(),
          selection_end_date: new Date(formData.selection_end_date).toISOString(),
          approver_email: formData.approver_email,
          members: validMembers
        })
      });

      setCommittee(response);
      setIsEditing(false);
      toast.success(isEditing ? "Vetting committee updated successfully" : "Vetting committee created successfully");
    } catch (error) {
      toast.error(isEditing ? "Failed to update vetting committee" : "Failed to create vetting committee");
    } finally {
      setCreating(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      default: return status.replace('_', ' ');
    }
  };

  const canEdit = (status: string) => {
    return status === 'open';
  };

  const canCancelSubmission = (status: string) => {
    return status === 'pending_approval';
  };

  const cancelSubmission = async () => {
    const result = await Swal.fire({
      title: 'Cancel Submission?',
      text: 'This will return the committee to open status for editing.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel submission!',
      cancelButtonText: 'Keep as submitted'
    });

    if (!result.isConfirmed) return;
    
    try {
      const response = await apiClient.request(`/vetting-committee/${committee?.id}/cancel-submission`, {
        method: "POST"
      });
      setCommittee(response);
      toast.success("Submission cancelled successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel submission");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show create form if no committee exists or if editing
  const showCreateForm = !committee || isEditing;
  


  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-medium text-gray-900 dark:text-white">Vetting Committee</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Manage vetting committee for {eventName}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

          {committee && !isEditing ? (
            <Card className="text-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Vetting Committee
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 relative z-10">

                    {canEdit(committee.status) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsEditing(true);
                            setFormData({
                              approver_email: committee.approver_email,
                              selection_start_date: committee.selection_start_date ? new Date(committee.selection_start_date).toISOString().split('T')[0] : '',
                              selection_end_date: committee.selection_end_date ? new Date(committee.selection_end_date).toISOString().split('T')[0] : '',
                              members: committee.members.map(m => ({ email: m.email, full_name: m.full_name }))
                            });
                          }}
                          className="text-blue-600 hover:bg-blue-50 pointer-events-auto h-7 px-2 text-xs"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteCommittee();
                          }}
                          className="text-red-600 hover:bg-red-50 pointer-events-auto h-7 px-2 text-xs"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>

                      </>
                    )}
                    {canCancelSubmission(committee.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          cancelSubmission();
                        }}
                        className="text-orange-600 hover:bg-orange-50 pointer-events-auto h-7 px-2 text-xs"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel Submission
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <Label className="font-medium text-xs">Selection Period</Label>
                  <p className="text-xs text-gray-600">
                    {committee.selection_start_date ? new Date(committee.selection_start_date).toLocaleDateString() : 'Not set'} - {committee.selection_end_date ? new Date(committee.selection_end_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <Label className="font-medium text-xs">Approver</Label>
                  <p className="text-xs text-gray-600">{committee.approver_email}</p>
                </div>
                
                <div>
                  <Label className="font-medium text-xs">Committee Members</Label>
                  <div className="mt-2 space-y-1">
                    {committee.members.map((member, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-xs">{member.email}</span>
                        {member.full_name && (
                          <span className="text-xs text-gray-500">({member.full_name})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <p className="text-xs text-gray-600">
                      Status: <span className={`font-medium ${
                        committee.status === 'open' ? 'text-blue-600' :
                        committee.status === 'pending_approval' ? 'text-orange-600' :
                        committee.status === 'approved' ? 'text-green-600' : ''
                      }`}>{getStatusDisplay(committee.status)}</span>
                    </p>
                    {committee.submitted_at && (
                      <p className="text-xs text-gray-600">
                        Submitted: <span className="font-medium">{new Date(committee.submitted_at).toLocaleDateString()}</span>
                      </p>
                    )}
                    {committee.approved_at && (
                      <p className="text-xs text-gray-600">
                        Approved: <span className="font-medium">{new Date(committee.approved_at).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : showCreateForm ? (
            <Card className="text-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isEditing ? 'Edit Vetting Committee' : 'Create Vetting Committee'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">


                <div>
                  <Label htmlFor="approver_email" className="mb-1 block text-xs font-medium">Approver Email (Learning & Development) *</Label>
                  <Input
                    id="approver_email"
                    type="email"
                    value={formData.approver_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, approver_email: e.target.value }))}
                    placeholder="approver@example.com"
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="selection_start_date" className="mb-1 block text-xs font-medium">Selection Start Date *</Label>
                    <Input
                      id="selection_start_date"
                      type="date"
                      value={formData.selection_start_date}
                      min={getDateConstraints().minStart}
                      max={getDateConstraints().maxStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, selection_start_date: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="selection_end_date" className="mb-1 block text-xs font-medium">Selection End Date *</Label>
                    <Input
                      id="selection_end_date"
                      type="date"
                      value={formData.selection_end_date}
                      min={getDateConstraints().minEnd}
                      max={getDateConstraints().maxEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, selection_end_date: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <Label className="block text-xs font-medium">Committee Member Email *</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addMemberField}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-7 px-3 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Member
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.members.map((member, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateMember(index, 'email', e.target.value)}
                          placeholder="member@example.com"
                          className="flex-1 text-xs"
                        />
                        <Input
                          value={member.full_name}
                          onChange={(e) => updateMember(index, 'full_name', e.target.value)}
                          placeholder="Member Name"
                          className="flex-1 text-xs"
                        />
                        {formData.members.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMemberField(index)}
                            className="text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={createCommittee}
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs"
                  >
                    {creating ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Committee" : "Create Committee")}
                  </Button>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          approver_email: "",
                          selection_start_date: "",
                          selection_end_date: "",
                          members: [{ email: "", full_name: "" }]
                        });
                      }}
                      className="text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
      </div>
    </ProtectedRoute>
  );
}