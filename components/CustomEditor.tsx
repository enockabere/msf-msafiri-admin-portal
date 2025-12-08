"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface CustomEditorProps {
  data: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

export default function CustomEditor({ data, onChange, placeholder }: CustomEditorProps) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={data}
      onChange={(_event, editor) => {
        const editorData = editor.getData();
        onChange(editorData);
      }}
      config={{
        toolbar: [
          'heading', '|',
          'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
          'blockQuote', 'undo', 'redo'
        ],
        placeholder: placeholder || "Enter description (optional)",
      }}
    />
  );
}
