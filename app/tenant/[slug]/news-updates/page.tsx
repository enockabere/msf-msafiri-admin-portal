'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth, useAuthenticatedApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Plus, Eye, Send, Newspaper, X, Save, Loader2 } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { LoadingScreen } from '@/components/ui/loading';

interface NewsUpdate {
  id: number;
  title: string;
  summary: string;
  content?: string;
  external_link?: string;
  content_type: string;
  category: string;
  is_important: boolean;
  is_published: boolean;
  scheduled_publish_at?: string;
  expires_at?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  published_at?: string;
}

const categories = [
  { value: 'general', label: 'General' },
  { value: 'health_program', label: 'Health Program' },
  { value: 'security', label: 'Security' },
  { value: 'events', label: 'Events' },
  { value: 'reports', label: 'Reports' },
  { value: 'announcement', label: 'Announcement' },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'health_program': return 'bg-green-100 text-green-800';
    case 'security': return 'bg-red-100 text-red-800';
    case 'events': return 'bg-purple-100 text-purple-800';
    case 'reports': return 'bg-blue-100 text-blue-800';
    case 'announcement': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function NewsUpdatesPage() {
  const { user, loading: authLoading } = useAuth();
  const { apiClient } = useAuthenticatedApi();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [newsUpdates, setNewsUpdates] = useState<NewsUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsUpdate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    external_link: '',
    content_type: 'text',
    category: 'general',
    is_important: false,
    scheduled_publish_at: '',
    expires_at: '',
    image_url: '',
  });
  const [publishOption, setPublishOption] = useState<'draft' | 'now' | 'scheduled'>('draft');

  useEffect(() => {
    fetchNewsUpdates();
  }, [authLoading, user]);

  const fetchNewsUpdates = async () => {
    if (authLoading || !user) {
      return;
    }

    try {
      const token = apiClient.getToken();
      const response = await fetch('/api/news-updates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNewsUpdates(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching news updates:', error);
      toast.error('Failed to load news updates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = apiClient.getToken();
      if (!token) {
        toast.error('Please log in again');
        return;
      }

      const url = editingNews
        ? `/api/news-updates/${editingNews.id}`
        : '/api/news-updates';

      const method = editingNews ? 'PUT' : 'POST';

      // Prepare submission data based on publish option
      const submissionData = {
        ...formData,
        is_published: publishOption === 'now',
        scheduled_publish_at: publishOption === 'scheduled' ? formData.scheduled_publish_at : null,
        expires_at: formData.expires_at || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const message = publishOption === 'now' 
          ? (editingNews ? 'News updated and published!' : 'News created and published!')
          : publishOption === 'scheduled'
          ? (editingNews ? 'News updated and scheduled!' : 'News created and scheduled!')
          : (editingNews ? 'News updated as draft' : 'News saved as draft');
        
        toast.success(message);
        setIsDialogOpen(false);
        resetForm();
        fetchNewsUpdates();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save news update');
      }
    } catch (error) {
      console.error('Error saving news update:', error);
      toast.error('Failed to save news update');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (newsId: number, isPublished: boolean) => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        toast.error('Please log in again');
        return;
      }

      const response = await fetch(`/api/news-updates/${newsId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_published: isPublished }),
      });

      if (response.ok) {
        toast.success(isPublished ? 'News published successfully' : 'News unpublished successfully');
        fetchNewsUpdates();
      } else {
        toast.error('Failed to update publication status');
      }
    } catch (error) {
      console.error('Error updating publication status:', error);
      toast.error('Failed to update publication status');
    }
  };

  const handleDelete = async (newsId: number) => {
    if (!confirm('Are you sure you want to delete this news update?')) {
      return;
    }

    try {
      const token = apiClient.getToken();
      if (!token) {
        toast.error('Please log in again');
        return;
      }

      const response = await fetch(`/api/news-updates/${newsId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('News update deleted successfully');
        fetchNewsUpdates();
      } else {
        toast.error('Failed to delete news update');
      }
    } catch (error) {
      console.error('Error deleting news update:', error);
      toast.error('Failed to delete news update');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      external_link: '',
      content_type: 'text',
      category: 'general',
      is_important: false,
      scheduled_publish_at: '',
      expires_at: '',
      image_url: '',
    });
    setPublishOption('draft');
    setEditingNews(null);
  };

  const openEditDialog = (news: NewsUpdate) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content || '',
      external_link: news.external_link || '',
      content_type: news.content_type || 'text',
      category: news.category,
      is_important: news.is_important,
      scheduled_publish_at: news.scheduled_publish_at || '',
      expires_at: news.expires_at || '',
      image_url: news.image_url || '',
    });
    if (news.is_published) {
      setPublishOption('now');
    } else if (news.scheduled_publish_at) {
      setPublishOption('scheduled');
    } else {
      setPublishOption('draft');
    }
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingScreen message="Loading news updates..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">News & Updates</h1>
            <p className="text-gray-600 mt-1">Manage news and updates for your organization</p>
          </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Create News
            </Button>
          </DialogTrigger>
          
          <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    {editingNews ? 'Edit News Update' : 'Create News Update'}
                  </DialogTitle>
                  <p className="text-red-100 text-xs mt-1">
                    {editingNews
                      ? 'Update the news article details and content'
                      : 'Share important news and updates with your team'
                    }
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto modal-scrollbar">
              <div className="p-6 pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title - Full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-900">
                      Title
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Enter a clear and engaging title"
                      className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                    />
                  </div>

                  {/* Summary - Full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="summary" className="text-sm font-semibold text-gray-900">
                      Summary
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      required
                      placeholder="Brief summary of the news (shown in previews)"
                      className="px-4 py-2.5 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all resize-none min-h-[4rem]"
                      rows={3}
                    />
                  </div>

                  {/* Full Content - Full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold text-gray-900">
                      Full Content
                    </Label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(content) => setFormData({ ...formData, content })}
                      placeholder="Write your detailed content here..."
                      height={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use the rich text editor to format your content with bold, italic, links, lists, and more.
                    </p>
                  </div>

                  {/* External Link - Full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="external_link" className="text-sm font-semibold text-gray-900">
                      External Link URL (Optional)
                    </Label>
                    <Input
                      id="external_link"
                      type="url"
                      value={formData.external_link}
                      onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                      placeholder="https://example.com/full-article"
                      className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If provided, users can access this link in addition to the content above
                    </p>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold text-gray-900">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-10 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-sm font-semibold text-gray-900">
                      Image URL
                    </Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                    />
                  </div>

                  {/* Important Toggle - Full width */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <Label htmlFor="is_important" className="text-sm font-semibold text-gray-900 cursor-pointer">
                          Mark as Important
                        </Label>
                        <p className="text-xs text-gray-500 mt-0.5">Important news will be highlighted and shown at the top</p>
                      </div>
                      <Switch
                        id="is_important"
                        checked={formData.is_important}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_important: checked })}
                        className="bg-gray-300 data-[state=checked]:bg-red-600"
                      />
                    </div>
                  </div>

                  {/* Publishing Options - Full width */}
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-sm font-semibold text-gray-900">
                      Publishing Options
                    </Label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="publish_option"
                          value="draft"
                          checked={publishOption === 'draft'}
                          onChange={(e) => setPublishOption(e.target.value as 'draft' | 'now' | 'scheduled')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Save as Draft</span>
                          <p className="text-xs text-gray-500">Save without publishing</p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="publish_option"
                          value="now"
                          checked={publishOption === 'now'}
                          onChange={(e) => setPublishOption(e.target.value as 'draft' | 'now' | 'scheduled')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Publish Now</span>
                          <p className="text-xs text-gray-500">Publish immediately and send notifications</p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="radio"
                          name="publish_option"
                          value="scheduled"
                          checked={publishOption === 'scheduled'}
                          onChange={(e) => setPublishOption(e.target.value as 'draft' | 'now' | 'scheduled')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Schedule Publishing</span>
                          <p className="text-xs text-gray-500">Set a future date and time to publish</p>
                        </div>
                      </label>
                    </div>
                    
                    {publishOption === 'scheduled' && (
                      <div className="mt-3">
                        <Label htmlFor="scheduled_publish_at" className="text-sm font-semibold text-gray-900">
                          Publish Date & Time
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="scheduled_publish_at"
                          type="datetime-local"
                          value={formData.scheduled_publish_at}
                          onChange={(e) => setFormData({ ...formData, scheduled_publish_at: e.target.value })}
                          min={new Date().toISOString().slice(0, 16)}
                          className="mt-1 h-10 pl-4 pr-4 text-sm border-2 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg transition-all"
                          required={publishOption === 'scheduled'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Action Buttons - Sticky at bottom */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="px-6 py-2.5 text-sm font-medium hover:bg-white transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingNews ? 'Update News' : 'Create News'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>

        <div className="grid gap-6">
        {newsUpdates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No news updates yet</h3>
              <p className="text-gray-500 text-center mb-4">
                Create your first news update to keep your team informed
              </p>
            </CardContent>
          </Card>
        ) : (
          newsUpdates.map((news) => (
            <Card key={news.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(news.category)}>
                        {categories.find(c => c.value === news.category)?.label || news.category}
                      </Badge>
                      {news.is_important && (
                        <Badge variant="destructive">Important</Badge>
                      )}
                      <Badge variant={news.is_published ? "default" : "secondary"}>
                        {news.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{news.title}</CardTitle>
                    <p className="text-gray-600 mb-3">{news.summary}</p>
                    <div className="text-sm text-gray-500">
                      Created: {formatDate(news.created_at)} by {news.created_by}
                      {news.published_at && (
                        <span className="ml-4">
                          Published: {formatDate(news.published_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(news)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant={news.is_published ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handlePublish(news.id, !news.is_published)}
                      className={news.is_published ? "" : "bg-green-600 hover:bg-green-700"}
                    >
                      {news.is_published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(news.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {(news.content || news.external_link) && (
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    {news.content && (
                      <div>
                        <h4 className="font-medium mb-2">Full Content:</h4>
                        <div 
                          className="text-gray-700 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: news.content }}
                        />
                      </div>
                    )}
                    {news.external_link && (
                      <div>
                        <h4 className="font-medium mb-2">External Link:</h4>
                        <a 
                          href={news.external_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {news.external_link}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}