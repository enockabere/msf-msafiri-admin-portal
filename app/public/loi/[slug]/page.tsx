"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";

interface LOIData {
  participant_name: string;
  event_name: string;
  template_content: string;
  logo_url?: string;
  signature_url?: string;
  qr_code_url?: string;
  participant_data: any;
  event_data: any;
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/loi/public/${slug}`);
        
        if (response.ok) {
          const data = await response.json();
          setLoiData(data);
        } else {
          setError(`LOI document not found`);
        }
      } catch (error) {
        setError("Failed to load LOI document");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLOIData();
    }
  }, [slug]);

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

  if (error || !loiData) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Letter of Invitation</h1>
                <p className="text-red-100">{loiData.participant_name} - {loiData.event_name}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: loiData.template_content }}
            />
          </div>

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