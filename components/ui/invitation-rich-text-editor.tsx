'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from './button';
import {
  Bold, Italic, Underline, List, Link, AlignLeft,
  AlignCenter, AlignRight, Image as ImageIcon,
  Type, Palette, Code
} from 'lucide-react';
import { useAuthenticatedApi } from '@/lib/auth';
import { toast } from 'sonner';

interface InvitationRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

// Template variables for invitation letters
const INVITATION_VARIABLES = [
  { variable: '{{participant_name}}', description: 'Participant full name' },
  { variable: '{{passport_number}}', description: 'Passport number' },
  { variable: '{{nationality}}', description: 'Participant nationality' },
  { variable: '{{date_of_birth}}', description: 'Date of birth' },
  { variable: '{{passport_issue_date}}', description: 'Passport issue date' },
  { variable: '{{passport_expiry_date}}', description: 'Passport expiry date' },
  { variable: '{{event_name}}', description: 'Event title' },
  { variable: '{{event_start_date}}', description: 'Event start date' },
  { variable: '{{event_end_date}}', description: 'Event end date' },
  { variable: '{{event_location}}', description: 'Event location/venue' },
  { variable: '{{accommodation_details}}', description: 'Hotel/accommodation details' },
  { variable: '{{organization_address}}', description: 'Complete organization address' },
  { variable: '{{signature_footer}}', description: 'Footer text below signature' },
  { variable: '{{organizer_name}}', description: 'Organizer full name' },
  { variable: '{{organizer_title}}', description: 'Organizer job title' },
  { variable: '{{logo}}', description: 'Organization logo' },
  { variable: '{{signature}}', description: 'Digital signature' },
  { variable: '{{qr_code}}', description: 'QR code for verification' },
];

export function InvitationRichTextEditor({
  value,
  onChange,
  placeholder,
  height = 400
}: InvitationRichTextEditorProps) {
  const { apiClient } = useAuthenticatedApi();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  // Initialize editor with default template if empty
  useEffect(() => {
    if (editorRef.current) {
      if (!value || value.trim() === '') {
        const defaultTemplate = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 20px 0;">
            <div style="flex: 1;">
              {{logo}}
            </div>
            <div style="flex: 1; text-align: center;">
              {{qr_code}}
            </div>
            <div style="flex: 1; text-align: right; font-size: 12px; line-height: 1.4;">
              {{organization_address}}
            </div>
          </div>
          
          <hr style="border: none; border-top: 2px solid #000; margin: 20px 0;" />

          <div style="margin: 30px 0; font-size: 14px; line-height: 1.6;">
            <p>The Director of Immigration Services<br>
            Nyayo House<br>
            NAIROBI, KENYA</p>
            
            <p style="margin: 20px 0;">Dear Sir/Madam,</p>
            
            <p style="margin: 20px 0; font-weight: bold;">RE: LETTER OF INVITATION FOR {{participant_name}}, PASSPORT NUMBER: {{passport_number}}</p>
            
            <p style="margin: 20px 0; text-align: justify;">Médecins Sans Frontières (MSF) is a private international, independent, medical humanitarian organization that delivers emergency aid to people affected by armed conflict, epidemic, healthcare exclusion and natural or man-made disasters.</p>
            
            <p style="margin: 20px 0; text-align: justify;">MSF has an Operational Support Hub in Kenya, where employees as well as visitors come in for meetings, project visit, induction and training. We will be having {{participant_name}} attend a {{event_name}} in {{event_location}} from {{event_start_date}} to {{event_end_date}}. Therefore, MSF kindly requests you to issue an electronic Travel Authorization (eTA), to Nairobi. They will be in possession of a return flight ticket to their project country.</p>
            
            <p style="margin: 20px 0; text-align: justify;">During their time in Kenya, {{participant_name}} will stay at {{accommodation_details}}. MSF guarantees to cover all costs related to their accommodation and onward travel.</p>
            
            <p style="margin: 20px 0; font-weight: bold;">Passport details:</p>
            <div style="margin: 20px 0; padding-left: 20px;">
              <p>Passport Number: {{passport_number}}</p>
              <p>Name: {{participant_name}}</p>
              <p>Nationality: {{nationality}}</p>
              <p>Date of Birth: {{date_of_birth}}</p>
              <p>Date of Issue: {{passport_issue_date}}</p>
              <p>Date of Expiry: {{passport_expiry_date}}</p>
            </div>
            
            <p style="margin: 30px 0 50px 0;">Thank you for your time and consideration.</p>
          </div>

          <div style="margin: 50px 0;">
            {{signature}}
            <p style="margin-top: 10px;"><strong>{{organizer_name}}</strong><br>
            {{organizer_title}}<br>
            {{organization_name}}</p>
            {{signature_footer}}
          </div>
          
          <hr style="border: none; border-top: 2px solid #000; margin: 40px 0 20px 0;" />
          
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #666;">
            <div style="flex: 1; text-align: center; font-weight: bold;">
              MEDECINS SANS FRONTIERES IS A PRIVATE INTERNATIONAL HUMANITARIAN ORGANISATION
            </div>
            <div style="text-align: right; margin-left: 20px;">
              Page: 1 / 2
            </div>
          </div>
        `;
        editorRef.current.innerHTML = defaultTemplate;
        onChange(defaultTemplate);
      } else {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const changeFontSize = () => {
    const size = prompt('Enter font size (1-7):', '3');
    if (size) {
      execCommand('fontSize', size);
    }
  };

  const changeTextColor = () => {
    const color = prompt('Enter color (e.g., #FF0000 or red):');
    if (color) {
      execCommand('foreColor', color);
    }
  };

  const insertVariable = (variable: string) => {
    const span = `<span style="background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 3px; font-weight: 500;">${variable}</span>&nbsp;`;
    document.execCommand('insertHTML', false, span);
    editorRef.current?.focus();
    setShowVariables(false);
    toast.success(`Inserted ${variable}`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
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
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const imageUrl = data.url;

      const img = `<img src="${imageUrl}" alt="Invitation image" style="max-width: 300px; height: auto; margin: 10px 0;" />`;
      document.execCommand('insertHTML', false, img);

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={changeFontSize}
          className="h-8 w-8 p-0"
          title="Font Size"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={changeTextColor}
          className="h-8 w-8 p-0"
          title="Text Color"
        >
          <Palette className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          className="h-8 w-8 p-0"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 p-0"
          title="Insert Image"
          disabled={uploading}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowVariables(!showVariables)}
            className="h-8 px-2"
            title="Insert Variable"
          >
            <Code className="h-4 w-4 mr-1" />
            <span className="text-xs">Variables</span>
          </Button>

          {showVariables && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-700">Click to insert variable:</p>
              </div>
              <div className="p-2 space-y-1">
                {INVITATION_VARIABLES.map(({ variable, description }) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex flex-col"
                  >
                    <span className="text-sm font-mono text-blue-600">{variable}</span>
                    <span className="text-xs text-gray-500">{description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {uploading && (
          <span className="text-xs text-gray-500 ml-2">Uploading...</span>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="p-4 focus:outline-none focus:ring-2 focus:ring-green-500 prose max-w-none overflow-y-auto"
        style={{ minHeight: height, maxHeight: height * 1.5 }}
        suppressContentEditableWarning={true}
      />

      {/* Helper Text */}
      <div className="px-4 py-2 bg-green-50 border-t border-green-200 text-xs text-green-800">
        💡 Use variables like <code className="bg-green-100 px-1 rounded">{'{{participant_name}}'}</code> for dynamic content. Logo, signature, and QR code will be automatically positioned.
      </div>
    </div>
  );
}