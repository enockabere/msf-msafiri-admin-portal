'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
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
  theme?: string;
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
  { variable: '{{tenantName}}', description: 'Organization/Tenant name' },
  { variable: '{{hotelLogo}}', description: 'Hotel logo image' },
  { variable: '{{signature}}', description: 'Signature image' },
  { variable: '{{qrCode}}', description: 'QR code for verification' },
];

export function AccommodationTemplateEditor({
  value,
  onChange,
  hotelName,
  placeholder,
  height = 400,
  theme
}: AccommodationTemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  // Memoize dependencies to prevent useEffect array size changes
  const dependencies = useMemo(() => [value, hotelName, theme], [value, hotelName, theme]);

  // Initialize editor with default template if empty or update colors when theme changes
  useEffect(() => {
    if (editorRef.current) {
      const isDark = theme === 'dark';
      
      // Only update if the content is significantly different to avoid cursor jumping
      const currentContent = editorRef.current.innerHTML;
      
      if (!value || value.trim() === '') {
        const defaultTemplate = `
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="margin-bottom: 20px; display: flex; justify-content: center;">\{\{hotelLogo\}\}</div>
            <h1 style="color: #dc2626; margin: 0;">PROOF OF ACCOMMODATION</h1>
            ${hotelName ? `<h2 style="color: ${isDark ? '#d1d5db' : '#374151'}; margin: 10px 0 0 0;">${hotelName}</h2>` : ''}
          </div>

          <p style="margin: 20px 0; color: ${isDark ? '#ffffff' : '#000000'};">Dear <strong>\{\{participantName\}\}</strong>,</p>

          <p style="color: ${isDark ? '#ffffff' : '#000000'};">This is to confirm your accommodation booking for the event <strong>\{\{eventName\}\}</strong>.</p>

          <div style="background: ${isDark ? '#000000' : '#f3f4f6'}; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: ${isDark ? '#ffffff' : '#1f2937'};">Accommodation Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; width: 200px; color: ${isDark ? '#ffffff' : '#000000'};">Hotel:</td>
                <td style="padding: 8px 0; color: ${isDark ? '#ffffff' : '#000000'};">\{\{hotelName\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: ${isDark ? '#ffffff' : '#000000'};">Address:</td>
                <td style="padding: 8px 0; color: ${isDark ? '#ffffff' : '#000000'};">\{\{hotelAddress\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: ${isDark ? '#ffffff' : '#000000'};">Check-in Date:</td>
                <td style="padding: 8px 0; color: ${isDark ? '#ffffff' : '#000000'};">\{\{checkInDate\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: ${isDark ? '#ffffff' : '#000000'};">Check-out Date:</td>
                <td style="padding: 8px 0; color: ${isDark ? '#ffffff' : '#000000'};">\{\{checkOutDate\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: ${isDark ? '#ffffff' : '#000000'};">Room Type:</td>
                <td style="padding: 8px 0; color: ${isDark ? '#ffffff' : '#000000'};">\{\{roomType\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: ${isDark ? '#ffffff' : '#000000'};">Room Number:</td>
                <td style="padding: 8px 0; color: ${isDark ? '#ffffff' : '#000000'};">\{\{roomNumber\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: ${isDark ? '#ffffff' : '#000000'};">Confirmation #:</td>
                <td style="padding: 8px 0; color: ${isDark ? '#ffffff' : '#000000'};">\{\{confirmationNumber\}\}</td>
              </tr>
            </table>
          </div>

          <p style="color: ${isDark ? '#ffffff' : '#000000'};">Please present this document along with your ID at the hotel reception upon check-in.</p>

          <p style="margin-top: 40px; color: ${isDark ? '#ffffff' : '#000000'};">Best regards,<br>\{\{signature\}\}<br><strong>\{\{tenantName\}\} Event Team</strong></p>
          
          <div style="position: relative; margin-top: 50px;">
            <div style="position: absolute; bottom: 0; right: 0;">\{\{qrCode\}\}</div>
          </div>
        `;
        editorRef.current.innerHTML = defaultTemplate;
        onChange(defaultTemplate);
      } else if (currentContent !== value) {
        // Only update if content is different and not currently being edited
        const isEditing = document.activeElement === editorRef.current;
        if (!isEditing) {
          editorRef.current.innerHTML = value;
        }
      }
    }
  }, [value, hotelName, theme, onChange]);

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
      // Save cursor position before updating
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const cursorOffset = range ? range.startOffset : 0;
      const cursorNode = range ? range.startContainer : null;
      
      onChange(editorRef.current.innerHTML);
      
      // Restore cursor position after update
      if (cursorNode && selection && range) {
        try {
          range.setStart(cursorNode, Math.min(cursorOffset, cursorNode.textContent?.length || 0));
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // If cursor restoration fails, just focus the editor
          editorRef.current?.focus();
        }
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden"
      style={{ 
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
      }}
    >
      {/* Toolbar */}
      <div 
        className="flex flex-wrap items-center gap-1 p-2 border-b"
        style={{
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
          backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb'
        }}
      >
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
        style={{ 
          minHeight: height, 
          maxHeight: height * 1.5,
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#000000'
        }}
        suppressContentEditableWarning={true}
      />

      {/* Helper Text */}
      <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-800">
        💡 Use variables like <code className="bg-blue-100 px-1 rounded">{'{{participantName}}'}</code> to personalize the document. They will be replaced with actual data when generated.
      </div>
    </div>
  );
}
