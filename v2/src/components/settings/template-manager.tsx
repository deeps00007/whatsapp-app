'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeTable, type RealtimeTableEvent } from '@/hooks/use-realtime-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MessageTemplate } from '@/types';

const CATEGORIES = ['Marketing', 'Utility', 'Authentication'] as const;
const HEADER_TYPES = ['text', 'image', 'video', 'document'] as const;

const categoryColors: Record<string, string> = {
  Marketing: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  Utility: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Authentication: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
};

const statusColors: Record<string, string> = {
  Draft: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  Pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  Approved: 'bg-primary/20 text-primary border-primary/30',
  Rejected: 'bg-red-600/20 text-red-400 border-red-600/30',
};

interface TemplateFormData {
  name: string;
  category: MessageTemplate['category'];
  language: string;
  body_text: string;
  header_type: string;
  header_content: string;
  footer_text: string;
}

const emptyForm: TemplateFormData = {
  name: '',
  category: 'Marketing',
  language: 'en_US',
  body_text: '',
  header_type: '',
  header_content: '',
  footer_text: '',
};

const COMMON_LANGUAGE_CODES = [
  'en_US', 'en_GB', 'en', 'es', 'es_ES', 'es_MX',
  'fr', 'fr_FR', 'de', 'it', 'pt_BR', 'pt_PT',
  'nl', 'pl', 'ru', 'tr', 'lt',
];

export function TemplateManager() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>(emptyForm);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetchTemplates(user.id);
  }, [authLoading, user?.id]);

  async function fetchTemplates(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  useRealtimeTable<MessageTemplate>({
    table: 'message_templates',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onEvent: (event: RealtimeTableEvent<MessageTemplate>) => {
      if (event.eventType === 'INSERT') {
        setTemplates((prev) => [event.new, ...prev]);
      } else if (event.eventType === 'UPDATE') {
        setTemplates((prev) =>
          prev.map((t) => (t.id === event.new.id ? { ...t, ...event.new } : t))
        );
        const oldStatus = templates.find((t) => t.id === event.new.id)?.status;
        if (event.new.status === 'Approved' && oldStatus !== 'Approved') {
          toast.success(`Template "${event.new.name}" approved!`);
        } else if (event.new.status === 'Rejected' && oldStatus !== 'Rejected') {
          toast.error(`Template "${event.new.name}" was rejected`);
        }
      } else if (event.eventType === 'DELETE') {
        setTemplates((prev) => prev.filter((t) => t.id !== (event.old as { id: string }).id));
      }
    },
  });

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Template name is required'); return; }
    if (!form.body_text.trim()) { toast.error('Body text is required'); return; }
    if (!user) { toast.error('Not authenticated'); return; }

    try {
      setSaving(true);

      const res = await fetch('/api/whatsapp/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          language: form.language.trim() || 'en_US',
          body_text: form.body_text.trim(),
          header_type: (form.header_type && form.header_type !== 'none') ? form.header_type : null,
          header_content: form.header_content?.trim() || null,
          footer_text: form.footer_text.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create template');

      toast.success(
        data.status === 'Approved'
          ? 'Template created and approved!'
          : `Template submitted to Meta. Status: ${data.status}. It will be reviewed before you can use it.`
      );
      setDialogOpen(false);
      setForm(emptyForm);
      await fetchTemplates(user.id);
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncFromMeta() {
    if (!user) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/templates/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Sync failed (HTTP ${res.status})`);
      toast.success(
        `Synced ${data.total} template${data.total === 1 ? '' : 's'} from Meta` +
        (data.inserted || data.updated ? ` (${data.inserted} new, ${data.updated} updated)` : '')
      );
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const preview = data.errors.slice(0, 3).map(
          (e: { name: string; language: string; message: string }) => `${e.name} (${e.language})`
        );
        toast.error(`Failed to sync: ${preview.join(', ')}${data.errors.length > 3 ? `, +${data.errors.length - 3} more` : ''}`);
      }
      await fetchTemplates(user.id);
    } catch (err) {
      console.error('Template sync error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  }

  async function handleCheckStatus(template: MessageTemplate) {
    if (!user) return;
    setCheckingStatus(template.id);
    try {
      const res = await fetch('/api/whatsapp/templates/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: template.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check status');

      const newStatus = data.status || template.status;
      if (newStatus !== template.status) {
        toast.success(`Template "${template.name}" is now ${newStatus}`);
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === template.id
              ? { ...t, status: newStatus as MessageTemplate['status'], meta_template_id: data.meta_template_id ?? t.meta_template_id }
              : t
          )
        );
      } else {
        toast.info(`Template "${template.name}" is still ${newStatus}`);
      }
    } catch (err) {
      console.error('Check status error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setCheckingStatus(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('message_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template deleted');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete template');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleSyncFromMeta}
          disabled={syncing}
          className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync from Meta'}
        </Button>
        <a
          href="https://business.facebook.com/wa/manage/message-templates/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
          >
            <ExternalLink className="size-4" />
            Template on Meta
          </Button>
        </a>
      </div>

      {templates.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700 ring-0 ring-transparent">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-slate-400 text-sm">No templates yet.</p>
            <p className="text-slate-500 text-xs mt-1">Create your first message template to submit it to Meta for approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Card key={template.id} className="bg-slate-900 border-slate-700 ring-0 ring-transparent">
              <CardContent className="flex items-start justify-between pt-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white">{template.name}</h3>
                    <Badge className={`text-xs border ${categoryColors[template.category] || ''}`}>
                      {template.category}
                    </Badge>
                    <Badge className={`text-xs border ${statusColors[template.status || 'Draft'] || ''}`}>
                      {template.status || 'Draft'}
                    </Badge>
                    {template.language && (
                      <span className="text-xs text-slate-500 uppercase">{template.language}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{template.body_text}</p>
                  {template.footer_text && (
                    <p className="text-xs text-slate-500 italic">{template.footer_text}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {(template.status === 'Pending' || template.status === 'Draft') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCheckStatus(template)}
                      disabled={checkingStatus === template.id}
                      className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 h-7 px-2"
                    >
                      {checkingStatus === template.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3" />
                      )}
                      Check
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">New Message Template</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create and submit a template to Meta for approval. Only approved templates can be used for messaging.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Template Name</Label>
              <Input
                placeholder="e.g. order_confirmation"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-500">Use lowercase with underscores. No spaces.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val as MessageTemplate['category'] })}
                >
                  <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white focus:bg-slate-700 focus:text-white">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Language</Label>
                <Input
                  list="template-language-codes"
                  placeholder="en_US"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <datalist id="template-language-codes">
                  {COMMON_LANGUAGE_CODES.map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Header Type</Label>
                <Select
                  value={form.header_type}
                  onValueChange={(val) => setForm({ ...form, header_type: val || '' })}
                >
                  <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="none" className="text-white focus:bg-slate-700 focus:text-white">None</SelectItem>
                    {HEADER_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-white focus:bg-slate-700 focus:text-white">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.header_type === 'text' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Header Text</Label>
                  <Input
                    placeholder="Header content"
                    value={form.header_content}
                    onChange={(e) => setForm({ ...form, header_content: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Body Text</Label>
              <Textarea
                placeholder="Enter your template message body. Use {{1}}, {{2}} for variables."
                value={form.body_text}
                onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                rows={4}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Footer Text</Label>
              <Input
                placeholder="Optional footer text"
                value={form.footer_text}
                onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <DialogFooter className="bg-slate-900 border-slate-700">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit to Meta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
