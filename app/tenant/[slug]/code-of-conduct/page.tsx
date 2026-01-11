'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from 'next-themes';

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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { apiClient, isReady, isLoading } = useAuthenticatedApi();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white">Loading Code of Conduct...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent dark:from-red-400/20 dark:via-red-400/10 dark:to-transparent"></div>
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 group-hover:scale-110 transition-all duration-300">
                <FileCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className={`text-base font-medium ${mounted && theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Code of Conduct</h1>
                <p className={`text-xs ${mounted && theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Manage your organization's code of conduct document</p>
              </div>
            </div>
            {currentCode?.document_url && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-300 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Document Active
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Document Info Card - Only show if document exists */}
      {currentCode && (
        <Card className="shadow-md hover:shadow-xl transition-all duration-300 border-0" style={{
          background: mounted && theme === 'dark' ? '#000000' : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
          borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-3 w-3 text-red-600" />
              Document Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="bg-red-100 rounded-lg p-1.5 mt-0.5">
                  <Calendar className="h-3 w-3 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{
                    color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }}>Created</p>
                  <p className="text-xs" style={{
                    color: mounted && theme === 'dark' ? '#ffffff' : '#111827'
                  }}>{formatDate(currentCode.created_at)}</p>
                  <p className="text-xs mt-0.5" style={{
                    color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }}>by {currentCode.created_by}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="bg-red-100 rounded-lg p-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{
                    color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }}>Last Updated</p>
                  <p className="text-xs" style={{
                    color: mounted && theme === 'dark' ? '#ffffff' : '#111827'
                  }}>{formatDate(currentCode.updated_at)}</p>
                  {currentCode.updated_by && (
                    <p className="text-xs mt-0.5" style={{
                      color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
                    }}>by {currentCode.updated_by}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Upload Section */}
        <Card className="lg:col-span-1 shadow-md hover:shadow-xl transition-all duration-300 border-0" style={{
          background: mounted && theme === 'dark' ? '#000000' : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
          borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-3 w-3 text-red-600" />
              Document Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
              {!currentCode?.document_url ? (
                <div className="border-2 border-dashed rounded-xl p-6 text-center transition-colors" style={{
                  borderColor: mounted && theme === 'dark' ? '#4b5563' : '#d1d5db',
                  backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb'
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = mounted && theme === 'dark' ? '#374151' : '#f3f4f6';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = mounted && theme === 'dark' ? '#1f2937' : '#f9fafb';
                }}>
                  <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2" style={{
                    color: mounted && theme === 'dark' ? '#ffffff' : '#111827'
                  }}>Upload Document</h3>
                  <p className="text-xs mb-4" style={{
                    color: mounted && theme === 'dark' ? '#9ca3af' : '#4b5563'
                  }}>Upload a PDF file (max 10MB)</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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

              <div className="pt-3 border-t" style={{
                borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
              }}>
                <h4 className="text-xs font-semibold mb-2" style={{
                  color: mounted && theme === 'dark' ? '#d1d5db' : '#374151'
                }}>Requirements</h4>
                <ul className="space-y-1 text-xs" style={{
                  color: mounted && theme === 'dark' ? '#9ca3af' : '#4b5563'
                }}>
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
        <Card className="lg:col-span-2 shadow-md hover:shadow-xl transition-all duration-300 border-0" style={{
          background: mounted && theme === 'dark' ? '#000000' : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
          borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
        }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-3 w-3 text-red-600" />
                Document Preview
              </CardTitle>
              {currentCode?.document_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(currentCode.document_url, '_blank')}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open in new tab
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {currentCode?.document_url ? (
              <div className="w-full h-[500px] border-2 rounded-xl overflow-hidden shadow-inner" style={{
                borderColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb',
                backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb'
              }}>
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
              <div className="w-full h-[500px] border-2 border-dashed rounded-xl flex items-center justify-center" style={{
                borderColor: mounted && theme === 'dark' ? '#4b5563' : '#d1d5db',
                backgroundColor: mounted && theme === 'dark' ? '#1f2937' : '#f9fafb'
              }}>
                <div className="text-center max-w-md">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{
                    backgroundColor: mounted && theme === 'dark' ? '#374151' : '#e5e7eb'
                  }}>
                    <AlertCircle className="h-6 w-6" style={{
                      color: mounted && theme === 'dark' ? '#9ca3af' : '#6b7280'
                    }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2" style={{
                    color: mounted && theme === 'dark' ? '#d1d5db' : '#374151'
                  }}>No Document Available</h3>
                  <p className="text-xs mb-3" style={{
                    color: mounted && theme === 'dark' ? '#9ca3af' : '#4b5563'
                  }}>Upload a PDF document to preview it here</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    size="sm"
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Upload Now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}