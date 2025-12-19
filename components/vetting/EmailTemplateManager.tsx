'use client';

import { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface EmailTemplate {
  id: number;
  template_type: 'selected' | 'not_selected';
  subject: string;
  content: string;
}

interface EmailTemplateManagerProps {
  committeeId: number;
  eventTitle: string;
  isApprover: boolean;
}

export default function EmailTemplateManager({
  committeeId,
  eventTitle,
  isApprover
}: EmailTemplateManagerProps) {
  const { apiClient } = useAuthenticatedApi();
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState({
    subject: '',
    content: ''
  });

  const [notSelectedTemplate, setNotSelectedTemplate] = useState({
    subject: '',
    content: ''
  });

  useEffect(() => {
    if (committeeId && isApprover) {
      loadTemplates();
    }
  }, [committeeId, isApprover]);

  const loadTemplates = async () => {
    try {
      const response = await apiClient.request<EmailTemplate[]>(
        `/vetting-email-templates/committee/${committeeId}/templates`
      );

      const templateMap: Record<string, EmailTemplate> = {};
      response.forEach(template => {
        templateMap[template.template_type] = template;
      });

      setTemplates(templateMap);

      if (templateMap.selected) {
        setSelectedTemplate({
          subject: templateMap.selected.subject,
          content: templateMap.selected.content
        });
      }

      if (templateMap.not_selected) {
        setNotSelectedTemplate({
          subject: templateMap.not_selected.subject,
          content: templateMap.not_selected.content
        });
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (type: 'selected' | 'not_selected') => {
    const templateData = type === 'selected' ? selectedTemplate : notSelectedTemplate;

    if (!templateData.subject.trim() || !templateData.content.trim()) {
      toast.error('Please fill in both subject and content');
      return;
    }

    setSaving(true);
    try {
      await apiClient.request(`/vetting-email-templates/committee/${committeeId}/templates`, {
        method: 'POST',
        body: JSON.stringify({
          template_type: type,
          subject: templateData.subject,
          content: templateData.content
        })
      });

      toast.success('Template saved successfully');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (!isApprover) {
    return null;
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Loading templates...</div>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
        <p className="text-sm text-gray-600">
          Create reusable email templates to send to participants after approval.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="selected">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selected">Selected Participants</TabsTrigger>
            <TabsTrigger value="not_selected">Not Selected Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="selected">
            <div className="space-y-4">
              <div>
                <Label>Subject Line</Label>
                <Input
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder={`Congratulations! You've been selected for ${eventTitle}`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Email Content</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Available variables: {'{participant_name}'}, {'{event_title}'}, {'{event_date}'}, {'{event_location}'}
                </p>
                <textarea
                  value={selectedTemplate.content}
                  onChange={(e) => setSelectedTemplate(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full min-h-[200px] p-3 border rounded-md text-sm font-mono"
                  placeholder={`Dear {participant_name},\n\nWe are pleased to inform you that you have been selected for ${eventTitle}.\n\nBest regards,\nMSF Team`}
                />
              </div>

              <Button
                onClick={() => saveTemplate('selected')}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="not_selected">
            <div className="space-y-4">
              <div>
                <Label>Subject Line</Label>
                <Input
                  value={notSelectedTemplate.subject}
                  onChange={(e) => setNotSelectedTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder={`Thank you for your application to ${eventTitle}`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Email Content</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Available variables: {'{participant_name}'}, {'{event_title}'}
                </p>
                <textarea
                  value={notSelectedTemplate.content}
                  onChange={(e) => setNotSelectedTemplate(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full min-h-[200px] p-3 border rounded-md text-sm font-mono"
                  placeholder={`Dear {participant_name},\n\nThank you for your interest in ${eventTitle}.\n\nUnfortunately, we are unable to select you at this time.\n\nBest regards,\nMSF Team`}
                />
              </div>

              <Button
                onClick={() => saveTemplate('not_selected')}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
