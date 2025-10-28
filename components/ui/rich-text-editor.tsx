'use client';

import { useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export function RichTextEditor({ value, onChange, placeholder, height = 300 }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <Editor
      apiKey="no-api-key" // Use free version
      onInit={(evt, editor) => editorRef.current = editor}
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        height: height,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | link | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        placeholder: placeholder,
        branding: false,
        promotion: false,
        setup: (editor) => {
          editor.on('init', () => {
            editor.getContainer().style.transition = 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out';
          });
          editor.on('focus', () => {
            editor.getContainer().style.borderColor = '#EE0000';
            editor.getContainer().style.boxShadow = '0 0 0 2px rgba(238, 0, 0, 0.2)';
          });
          editor.on('blur', () => {
            editor.getContainer().style.borderColor = '#d1d5db';
            editor.getContainer().style.boxShadow = 'none';
          });
        }
      }}
    />
  );
}