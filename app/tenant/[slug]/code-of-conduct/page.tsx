'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthenticatedApi } from '@/lib/auth';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Download,
  FileCheck
} from 'lucide-react';

interface CodeOfConduct {
  id: number;
  title: string;
  content?: string;
  document_url?: string;
  document_public_id?: string;
  version?: string;
  effective_date?: string;
  is_active: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export default function CodeOfConductPage() {
  const params = useParams();
  const tenantSlug = params.slug as string;
  const [currentCode, setCurrentCode] = useState<CodeOfConduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { apiClient, isReady, isLoading } = useAuthenticatedApi();

  useEffect(() => {
    // Wait for authentication to be ready before fetching
    if (isReady) {
      fetchCurrentCode();
    }
  }, [isReady]);

  const fetchCurrentCode = async () => {
    setLoading(true);
    try {
      const response = await apiClient.request('/code-of-conduct/');
      if (response) {
        setCurrentCode(response);
      } else {
        setCurrentCode(null);
      }
    } catch (error) {
      console.log('No active code of conduct found');
      setCurrentCode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
      console.log('API Token:', apiClient.getToken() ? 'Present' : 'Missing');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const uploadResponse = await fetch(`${apiUrl}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`
        },
        body: formData
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ detail: 'Upload failed' }));
        console.error('Upload error:', errorData);
        toast.error(errorData.detail || `Upload failed with status ${uploadResponse.status}`);
        return; // Exit early on error
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload result:', uploadResult);

      if (!uploadResult.success) {
        toast.error('Upload failed: Invalid response from server');
        return; // Exit early if upload wasn't successful
      }

      // Update or create code of conduct with document URL
      const payload = {
        title: 'Code of Conduct',
        document_url: uploadResult.url,
        document_public_id: uploadResult.public_id
      };

      console.log('Creating/updating code of conduct with payload:', payload);

      if (currentCode) {
        await apiClient.request(`/code-of-conduct/${currentCode.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Code of conduct updated successfully');
      } else {
        await apiClient.request('/code-of-conduct/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Code of conduct uploaded successfully');
      }

      await fetchCurrentCode();
    } catch (error) {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Removed handleSubmit as we only need upload functionality

  const handleReupload = () => {
    fileInputRef.current?.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || (loading && !currentCode)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading Code of Conduct...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section - matching vendor hotels design */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Code of Conduct</h1>
                <p className="text-sm text-gray-600">Manage your organization's code of conduct document</p>
              </div>
            </div>
            {currentCode?.document_url && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-300">
                <CheckCircle className="h-4 w-4 mr-2" />
                Document Active
              </Badge>
            )}
          </div>
        </div>

        {/* Document Info Card - Only show if document exists */}
        {currentCode && (
          <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-red-600" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-lg p-2 mt-0.5">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
                    <p className="text-sm text-gray-900">{formatDate(currentCode.created_at)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">by {currentCode.created_by}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 rounded-lg p-2 mt-0.5">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Last Updated</p>
                    <p className="text-sm text-gray-900">{formatDate(currentCode.updated_at)}</p>
                    {currentCode.updated_by && (
                      <p className="text-xs text-gray-500 mt-0.5">by {currentCode.updated_by}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Upload Section */}
          <Card className="lg:col-span-1 shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-red-600" />
                Document Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {!currentCode?.document_url ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Upload Document</h3>
                  <p className="text-xs text-gray-600 mb-4">Upload a PDF file (max 10MB)</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    size="sm"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose PDF File
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <Alert className="border-2 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-xs font-medium">
                      Document uploaded and active
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={handleReupload}
                      variant="outline"
                      className="w-full border-2 border-gray-300 hover:bg-gray-50 text-xs"
                      size="sm"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Replace Document
                    </Button>

                    <Button
                      type="button"
                      onClick={() => window.open(currentCode.document_url, '_blank')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />

              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Requirements</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>PDF format only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Maximum file size: 10MB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Replaces previous version</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* PDF Viewer */}
          <Card className="lg:col-span-2 shadow-md hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-red-600" />
                  Document Preview
                </CardTitle>
                {currentCode?.document_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(currentCode.document_url, '_blank')}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in new tab
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {currentCode?.document_url ? (
                <div className="w-full h-[600px] border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner bg-gray-50">
                  <iframe
                    src={`${currentCode.document_url}#toolbar=1&navpanes=1`}
                    className="w-full h-full"
                    title="Code of Conduct PDF"
                    onError={() => {
                      console.error('Failed to load PDF in iframe');
                      toast.error('Failed to load PDF preview. Try opening in a new tab.');
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-[600px] border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500 max-w-md">
                    <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-2">No Document Available</h3>
                    <p className="text-sm text-gray-600 mb-4">Upload a PDF document to preview it here</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Now
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}