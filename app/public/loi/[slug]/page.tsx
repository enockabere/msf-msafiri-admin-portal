"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { User, Calendar, MapPin, Clock, FileText, Download, CheckCircle } from "lucide-react";

interface LOIData {
  passport_no?: string;
  given_names?: string;
  surname?: string;
  nationality?: string;
  date_of_birth?: string;
  date_of_expiry?: string;
  issue_country?: string;
  gender?: string;
  attachmeent_ids?: Array<{
    id: number;
    name: string;
    filename?: string;
    size?: number;
    datas: string; // base64 encoded file data
  }>;
}

export default function PublicLOIPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loiData, setLoiData] = useState<LOIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLOIData = async () => {
      try {
        console.log('Fetching LOI data for slug:', slug);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/loi/slug/${slug}`);
        console.log('LOI response:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('LOI data received:', data);
          setLoiData(data);
        } else {
          const errorText = await response.text();
          console.error('LOI fetch failed:', response.status, errorText);
          setError(`Failed to load LOI document (${response.status})`);
        }
      } catch (error) {
        console.error('LOI fetch error:', error);
        setError("Failed to load LOI document - network error");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLOIData();
    }
  }, [slug]);

  const downloadBase64File = (base64Data: string, fileName: string) => {
    try {
      console.log('Starting download for:', fileName);
      
      // Remove data URL prefix if present
      const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      
      // Decode base64 to binary
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Create blob with proper MIME type
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download triggered successfully');
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try using a different browser or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LOI document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Please ensure you have the correct LOI document link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!loiData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Document Available</h1>
            <p className="text-gray-600 mb-4">
              The LOI document is not available or has not been processed yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const data = loiData;
  const attachments = data?.attachmeent_ids || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Letter of Invitation (LOI)</h1>
                <p className="text-red-100">Document Reference: {slug}</p>
              </div>
            </div>
          </div>

          {/* Participant Details */}
          {data && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Participant Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Full Name:</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {data.given_names && data.surname ? `${data.given_names} ${data.surname}` : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Passport No:</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {data.passport_no || 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Nationality:</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {data.nationality || 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Gender:</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {data.gender || 'Not available'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Passport Expiry:</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {data.date_of_expiry ? new Date(data.date_of_expiry).toLocaleDateString() : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Issue Country:</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {data.issue_country || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOI Documents */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">LOI Documents</h2>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-4">
                {attachments.map((attachment, index) => {
                  const fileName = attachment.name || attachment.filename || `LOI_Document_${index + 1}.pdf`;
                  const fileSize = attachment.size;

                  return (
                    <div
                      key={attachment.id || index}
                      className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-100 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-red-500 rounded-lg p-3">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{fileName}</h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-600">
                                Type: PDF Document
                              </span>
                              {fileSize && (
                                <span className="text-sm text-gray-600">
                                  Size: {(fileSize / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadBase64File(attachment.datas, fileName)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Download className="h-4 w-4" />
                            Download LOI
                          </button>
                          <button
                            onClick={() => {
                              try {
                                // Remove data URL prefix if present
                                const base64Content = attachment.datas.includes(',') ? attachment.datas.split(',')[1] : attachment.datas;
                                
                                // Decode base64 to binary
                                const byteCharacters = atob(base64Content);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                
                                // Create blob with proper MIME type
                                const blob = new Blob([byteArray], { type: 'application/pdf' });
                                const blobUrl = URL.createObjectURL(blob);
                                
                                // Open in new window with proper PDF viewer
                                const newWindow = window.open('', '_blank');
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${fileName}</title>
                                        <style>
                                          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                          .header { background: #dc2626; color: white; padding: 10px; text-align: center; }
                                          .content { height: calc(100vh - 50px); }
                                          iframe { width: 100%; height: 100%; border: none; }
                                          .fallback { padding: 20px; text-align: center; }
                                          .download-btn { background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h3>${fileName}</h3>
                                        </div>
                                        <div class="content">
                                          <iframe src="${blobUrl}" type="application/pdf">
                                            <div class="fallback">
                                              <p>Your browser doesn't support PDF viewing.</p>
                                              <a href="${blobUrl}" download="${fileName}" class="download-btn">Download PDF</a>
                                            </div>
                                          </iframe>
                                        </div>
                                        <script>
                                          // Cleanup blob URL when window closes
                                          window.addEventListener('beforeunload', function() {
                                            URL.revokeObjectURL('${blobUrl}');
                                          });
                                        </script>
                                      </body>
                                    </html>
                                  `);
                                  newWindow.document.close();
                                } else {
                                  alert('Please allow popups to view the PDF.');
                                }
                              } catch (error) {
                                console.error('PDF view failed:', error);
                                alert('Failed to open PDF viewer. Please try downloading the file instead.');
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <FileText className="h-4 w-4" />
                            View PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        LOI Document Available
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        This Letter of Invitation is valid for visa applications and travel purposes. 
                        Please download and keep a copy for your records.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No LOI Documents Available
                </h3>
                <p className="text-gray-600 mb-4">
                  The Letter of Invitation documents are not yet available for this record.
                </p>
                <p className="text-sm text-gray-500">
                  Please contact the event organizers if you need assistance.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <p className="text-xs text-gray-500 text-center">
              This LOI document is generated from official records. For any questions or issues, 
              please contact the event organizers or MSF administration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}