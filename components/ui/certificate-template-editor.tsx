"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthenticatedApi } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface CertificateTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  logoUrl?: string;
  onLogoUpload?: (logoUrl: string, publicId: string) => void;
  onLogoRemove?: () => void;
}

const TEMPLATE_VARIABLES = [
  { name: "participantName", label: "Participant Name", description: "Full name of the participant" },
  { name: "eventTitle", label: "Event Title", description: "Name of the event/training" },
  { name: "startDate", label: "Start Date", description: "Event start date" },
  { name: "endDate", label: "End Date", description: "Event end date" },
  { name: "organizerName", label: "Organizer Name", description: "Name of the organizing person" },
  { name: "organizerTitle", label: "Organizer Title", description: "Title/position of organizer" },
  { name: "facilitatorName", label: "Facilitator Name", description: "Name of the facilitator" },
  { name: "facilitatorTitle", label: "Facilitator Title", description: "Title/position of facilitator" },
  { name: "coordinatorName", label: "Coordinator Name", description: "Name of the coordinator" },
  { name: "coordinatorTitle", label: "Coordinator Title", description: "Title/position of coordinator" },
  { name: "eventLocation", label: "Event Location", description: "Location where event took place" },
  { name: "completionDate", label: "Completion Date", description: "Date of completion" },
  { name: "certificateDate", label: "Certificate Date", description: "Date certificate was issued" },
];

const DEFAULT_TEMPLATE = `
<div style="text-align: center; font-family: 'Times New Roman', serif; padding: 40px; border: 3px solid #d32f2f; margin: 20px;">
  <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 20px; color: #000;">TRAINING ATTENDANCE CERTIFICATE</h1>
  
  <p style="font-size: 18px; margin: 30px 0;">This certificate attests to the fact that</p>
  
  <h2 style="font-size: 28px; font-weight: bold; margin: 30px 0; border-bottom: 2px dotted #000; display: inline-block; padding-bottom: 2px;">{{participantName}}</h2>
  
  <p style="font-size: 18px; margin: 20px 0;">has participated in and completed the</p>
  
  <h3 style="font-size: 24px; font-weight: bold; margin: 30px 0; color: #d32f2f;">{{eventTitle}}</h3>
  
  <p style="font-size: 16px; margin: 20px 0;">From {{startDate}} until {{endDate}},<br/>
  Organized by Médecins Sans Frontières OCA</p>
  
  <div style="display: flex; justify-content: space-between; margin-top: 60px; text-align: left;">
    <div style="width: 30%;">
      <div style="margin-bottom: 5px; height: 50px;"></div>
      <p style="font-size: 14px; font-weight: bold;">{{organizerName}}</p>
      <p style="font-size: 12px;">{{organizerTitle}}</p>
    </div>

    <div style="width: 30%;">
      <div style="margin-bottom: 5px; height: 50px;"></div>
      <p style="font-size: 14px; font-weight: bold;">{{facilitatorName}}</p>
      <p style="font-size: 12px;">{{facilitatorTitle}}</p>
    </div>

    <div style="width: 30%;">
      <div style="margin-bottom: 5px; height: 50px;"></div>
      <p style="font-size: 14px; font-weight: bold;">{{coordinatorName}}</p>
      <p style="font-size: 12px;">{{coordinatorTitle}}</p>
    </div>
  </div>
</div>

<div style="page-break-before: always;"></div>

<div style="position: relative; font-family: 'Times New Roman', serif; padding: 40px; border: 3px solid #d32f2f; margin: 20px; min-height: 600px;">
  <!-- Watermark - applies to this page and should be added to any additional pages -->
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; z-index: 0; pointer-events: none;">
    {{logoWatermark}}
  </div>

  <div style="position: relative; z-index: 1; text-align: left;">
    <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #d32f2f; text-align: center; text-decoration: underline;">{{eventTitle}}</h2>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #000;">ABOUT</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #333;">{{courseDescription}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #000;">COURSE OBJECTIVES</h3>
      <ul style="font-size: 14px; line-height: 1.6; color: #333; padding-left: 20px;">
        {{#each courseObjectives}}
        <li style="margin-bottom: 5px;">{{this}}</li>
        {{/each}}
      </ul>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #000;">KEY COURSE CONTENTS</h3>
      <ul style="font-size: 14px; line-height: 1.6; color: #333; padding-left: 20px;">
        {{#each courseContents}}
        <li style="margin-bottom: 5px;">{{this}}</li>
        {{/each}}
      </ul>
    </div>
    
    <div style="margin-top: 50px; text-align: center;">
      <p style="font-size: 14px; color: #666;">Certificate issued on {{certificateDate}}</p>
      <p style="font-size: 14px; color: #666;">Location: {{eventLocation}}</p>
    </div>
  </div>
</div>
`;

export function CertificateTemplateEditor({ 
  value, 
  onChange, 
  placeholder = "Design your certificate template...",
  height = 400,
  logoUrl,
  onLogoUpload,
  onLogoRemove
}: CertificateTemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { apiClient } = useAuthenticatedApi();

  useEffect(() => {
    if (editorRef.current && !value) {
      const template = DEFAULT_TEMPLATE;
      onChange(template);
      editorRef.current.innerHTML = template;
    }
  }, [value, onChange]);

  const insertVariable = (variable: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const variableNode = document.createTextNode(`{{${variable}}}`);
      range.deleteContents();
      range.insertNode(variableNode);
      
      range.setStartAfter(variableNode);
      range.setEndAfter(variableNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const currentValue = value || DEFAULT_TEMPLATE;
      onChange(currentValue + `{{${variable}}}`);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file || !onLogoUpload) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only image files (JPEG, PNG, GIF, WEBP) are allowed", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/documents/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        toast({ title: "Error", description: errorData.detail, variant: "destructive" });
        return;
      }

      const result = await response.json();
      if (result.success) {
        onLogoUpload(result.url, result.public_id);
        toast({ title: "Success", description: "Logo uploaded successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getTemplateWithLogo = (templateContent: string, logoUrl?: string) => {
    if (!logoUrl) return templateContent;
    
    // Add logo to page one at the top
    let updatedTemplate = templateContent.replace(
      '<h1 style="font-size: 36px; font-weight: bold; margin-bottom: 20px; color: #000;">TRAINING ATTENDANCE CERTIFICATE</h1>',
      `<div style="text-align: center; margin-bottom: 30px;">
        <img src="${logoUrl}" alt="Organization Logo" style="max-height: 100px; max-width: 300px; display: block; margin: 0 auto;" />
      </div>
      <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 20px; color: #000;">TRAINING ATTENDANCE CERTIFICATE</h1>`
    );
    
    // Add watermark to page two
    updatedTemplate = updatedTemplate.replace(
      '<div style="position: relative; z-index: 1; text-align: left;">',
      `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; z-index: 0; pointer-events: none;">
        <img src="${logoUrl}" alt="Watermark" style="max-width: 400px; max-height: 400px;" />
      </div>
      <div style="position: relative; z-index: 1; text-align: left;">`
    );
    
    return updatedTemplate;
  };

  const loadDefaultTemplate = () => {
    const template = DEFAULT_TEMPLATE;
    onChange(template);
    if (editorRef.current) {
      editorRef.current.innerHTML = template;
    }
  };

  return (
    <div className="space-y-4">
      {/* Logo Upload Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Certificate Logo</h4>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Certificate Logo" className="h-16 w-auto border border-gray-200 rounded" />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Replace
                </Button>
                {onLogoRemove && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onLogoRemove}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoUpload(file);
          }}
          className="hidden"
        />
        <p className="text-xs text-gray-500">
          Upload a logo image (JPEG, PNG, GIF, WEBP) up to 5MB. Logo will appear at the top of certificates.
        </p>
      </div>

      {/* Variable Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Template Variables</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadDefaultTemplate}
            className="text-xs"
          >
            Load Default Template
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((variable) => (
            <Badge
              key={variable.name}
              variant="outline"
              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 text-xs"
              onClick={() => insertVariable(variable.name)}
              title={variable.description}
            >
              {variable.label}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Click on any variable above to insert it at your cursor position. Variables will be replaced with actual data when certificates are generated.
        </p>
      </div>

      {/* Editor */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-300 p-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => document.execCommand('bold')}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => document.execCommand('italic')}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => document.execCommand('underline')}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            >
              <u>U</u>
            </button>
            <div className="w-px h-4 bg-gray-300"></div>
            <button
              type="button"
              onClick={() => document.execCommand('justifyLeft')}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => document.execCommand('justifyCenter')}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            >
              Center
            </button>
            <button
              type="button"
              onClick={() => document.execCommand('justifyRight')}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
            >
              Right
            </button>
            <div className="w-px h-4 bg-gray-300"></div>
            <select
              onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="1">Small</option>
              <option value="3">Normal</option>
              <option value="5">Large</option>
              <option value="7">Extra Large</option>
            </select>
          </div>
        </div>
        
        <div
          ref={editorRef}
          contentEditable
          className="p-4 min-h-[400px] focus:outline-none"
          style={{ height: `${height}px`, overflowY: 'auto' }}
          dangerouslySetInnerHTML={{ __html: value || DEFAULT_TEMPLATE }}
          onInput={handleContentChange}
          onBlur={handleContentChange}
        />
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Preview</h4>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
          <div 
            className="text-xs"
            dangerouslySetInnerHTML={{ __html: getTemplateWithLogo(value || DEFAULT_TEMPLATE, logoUrl) }} 
          />
        </div>
      </div>
    </div>
  );
}