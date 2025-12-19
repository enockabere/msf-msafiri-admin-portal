'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from './button';
import {
  Bold, Italic, Underline, List, Link, AlignLeft,
  AlignCenter, AlignRight, Image as ImageIcon,
  Type, Palette, Code
} from 'lucide-react';
import { toast } from 'sonner';

interface AccommodationTemplateEditorProps {
  value: string;
  onChange: (content: string) => void;
  hotelName?: string;
  placeholder?: string;
  height?: number;
}

// Template variables that can be used
const TEMPLATE_VARIABLES = [
  { variable: '{{participantName}}', description: 'Participant full name' },
  { variable: '{{hotelName}}', description: 'Hotel/Accommodation name' },
  { variable: '{{hotelAddress}}', description: 'Hotel address' },
  { variable: '{{checkInDate}}', description: 'Check-in date' },
  { variable: '{{checkOutDate}}', description: 'Check-out date' },
  { variable: '{{roomNumber}}', description: 'Room number' },
  { variable: '{{roomType}}', description: 'Room type (Single/Double)' },
  { variable: '{{eventName}}', description: 'Event name' },
  { variable: '{{eventDates}}', description: 'Event dates' },
  { variable: '{{confirmationNumber}}', description: 'Booking confirmation number' },
];

export function AccommodationTemplateEditor({
  value,
  onChange,
  hotelName,
  placeholder,
  height = 400
}: AccommodationTemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  // Initialize editor with default template if empty
  useEffect(() => {
    if (editorRef.current) {
      if (!value || value.trim() === '') {
        const defaultTemplate = `
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">PROOF OF ACCOMMODATION</h1>
            ${hotelName ? `<h2 style="color: #374151; margin: 10px 0 0 0;">${hotelName}</h2>` : ''}
          </div>

          <p style="margin: 20px 0;">Dear <strong>{{participantName}}</strong>,</p>

          <p>This is to confirm your accommodation booking for the event <strong>{{eventName}}</strong>.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937;">Accommodation Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; width: 200px;">Hotel:</td>
                <td style="padding: 8px 0;">{{hotelName}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Address:</td>
                <td style="padding: 8px 0;">{{hotelAddress}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Check-in Date:</td>
                <td style="padding: 8px 0;">{{checkInDate}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Check-out Date:</td>
                <td style="padding: 8px 0;">{{checkOutDate}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Room Type:</td>
                <td style="padding: 8px 0;">{{roomType}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Room Number:</td>
                <td style="padding: 8px 0;">{{roomNumber}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Confirmation #:</td>
                <td style="padding: 8px 0;">{{confirmationNumber}}</td>
              </tr>
            </table>
          </div>

          <p>Please present this document along with your ID at the hotel reception upon check-in.</p>

          <p style="margin-top: 40px;">Best regards,<br><strong>MSF Event Team</strong></p>
        `;
        editorRef.current.innerHTML = defaultTemplate;
        onChange(defaultTemplate);
      } else {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, hotelName, onChange]);

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
    const span = `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px; font-weight: 500;">${variable}</span>&nbsp;`;
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload/email-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const imageUrl = data.url;

      const img = `<img src="${imageUrl}" alt="Hotel logo" style="max-width: 200px; height: auto; margin: 10px 0;" />`;
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
          title="Insert Image (Logo)"
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
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-700">Click to insert variable:</p>
              </div>
              <div className="p-2 space-y-1">
                {TEMPLATE_VARIABLES.map(({ variable, description }) => (
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
        className="p-4 focus:outline-none focus:ring-2 focus:ring-red-500 prose max-w-none overflow-y-auto"
        style={{ minHeight: height, maxHeight: height * 1.5 }}
        suppressContentEditableWarning={true}
      />

      {/* Helper Text */}
      <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-800">
        💡 Use variables like <code className="bg-blue-100 px-1 rounded">{'{{participantName}}'}</code> to personalize the document. They will be replaced with actual data when generated.
      </div>
    </div>
  );
}
