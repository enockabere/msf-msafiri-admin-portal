'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Plus, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { LoadingScreen } from '@/components/ui/loading';

interface NewsUpdate {
  id: number;
  title: string;
  summary: string;
  content?: string;
  category: string;
  is_important: boolean;
  is_published: boolean;
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
  const { data: session } = useSession();
  const params = useParams();
  const tenantSlug = params.slug as string;

  const [newsUpdates, setNewsUpdates] = useState<NewsUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsUpdate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'general',
    is_important: false,
    image_url: '',
  });

  useEffect(() => {
    fetchNewsUpdates();
  }, []);

  const fetchNewsUpdates = async () => {
    try {
      const response = await fetch('/api/news-updates', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
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
    
    try {
      const url = editingNews 
        ? `/api/news-updates/${editingNews.id}`
        : '/api/news-updates';
      
      const method = editingNews ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingNews ? 'News updated successfully' : 'News created successfully');
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
    }
  };

  const handlePublish = async (newsId: number, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/news-updates/${newsId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
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
      const response = await fetch(`/api/news-updates/${newsId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
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
      category: 'general',
      is_important: false,
      image_url: '',
    });
    setEditingNews(null);
  };

  const openEditDialog = (news: NewsUpdate) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content || '',
      category: news.category,
      is_important: news.is_important,
      image_url: news.image_url || '',
    });
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
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNews ? 'Edit News Update' : 'Create News Update'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter news title"
                />
              </div>
              
              <div>
                <Label htmlFor="summary">Summary *</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  required
                  placeholder="Brief summary of the news"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="content">Full Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detailed content (optional)"
                  rows={6}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
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
                
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_important"
                  checked={formData.is_important}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_important: checked })}
                />
                <Label htmlFor="is_important">Mark as Important</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingNews ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
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
              
              {news.content && (
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Full Content:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{news.content}</p>
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