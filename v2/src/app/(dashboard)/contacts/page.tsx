'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRealtimeTable, type RealtimeTableEvent } from '@/hooks/use-realtime-table';
import { useAuth } from '@/hooks/use-auth';
import type { Contact, Tag, ContactTag, ContactList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  List,
  X,
  ListPlus,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ContactForm } from '@/components/contacts/contact-form';
import { ContactDetailView } from '@/components/contacts/contact-detail-view';
import { ImportModal } from '@/components/contacts/import-modal';

const PAGE_SIZE = 25;

interface ContactWithTags extends Contact {
  tags?: Tag[];
}

export default function ContactsPage() {
  const supabase = createClient();
  const { user } = useAuth();

  const [contacts, setContacts] = useState<ContactWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Lists
  const [lists, setLists] = useState<ContactList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listMemberIds, setListMemberIds] = useState<Set<string>>(new Set());
  const [newListName, setNewListName] = useState('');
  const [newListOpen, setNewListOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [addToListTarget, setAddToListTarget] = useState<ContactList | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [listCounts, setListCounts] = useState<Record<string, number>>({});
  const [importListId, setImportListId] = useState<string | null>(null);
  const [importListName, setImportListName] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editContactTags, setEditContactTags] = useState<ContactTag[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailContactId, setDetailContactId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  // All tags for display
  const [tagsMap, setTagsMap] = useState<Record<string, Tag>>({});

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('tags').select('*');
    if (data) {
      const map: Record<string, Tag> = {};
      data.forEach((t) => (map[t.id] = t));
      setTagsMap(map);
    }
  }, [supabase]);

  const fetchLists = useCallback(async () => {
    const { data } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false });
    if (data) {
      setLists(data as ContactList[]);

      const counts: Record<string, number> = {};
      for (const lst of data) {
        const { count } = await supabase
          .from('contact_list_members')
          .select('id', { count: 'exact', head: true })
          .eq('list_id', lst.id);
        counts[lst.id] = count ?? 0;
      }
      setListCounts(counts);
    }
  }, [supabase, user?.id]);

  const fetchListMembers = useCallback(async (listId: string) => {
    const { data } = await supabase
      .from('contact_list_members')
      .select('contact_id')
      .eq('list_id', listId);
    setListMemberIds(new Set((data ?? []).map((m: { contact_id: string }) => m.contact_id)));
  }, [supabase]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},phone.ilike.${term},email.ilike.${term}`);
    }

    if (selectedListId) {
      query = query.in('id', Array.from(listMemberIds));
    }

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load contacts');
      setLoading(false);
      return;
    }

    setTotalCount(count ?? 0);

    if (!data || data.length === 0) {
      setContacts([]);
      setLoading(false);
      return;
    }

    // Fetch tags for these contacts
    const contactIds = data.map((c) => c.id);
    const { data: contactTags } = await supabase
      .from('contact_tags')
      .select('contact_id, tag_id')
      .in('contact_id', contactIds);

    const tagsByContact: Record<string, string[]> = {};
    contactTags?.forEach((ct) => {
      if (!tagsByContact[ct.contact_id]) tagsByContact[ct.contact_id] = [];
      tagsByContact[ct.contact_id].push(ct.tag_id);
    });

    const enriched: ContactWithTags[] = data.map((c) => ({
      ...c,
      tags: (tagsByContact[c.id] ?? [])
        .map((tid) => tagsMap[tid])
        .filter(Boolean),
    }));

    setContacts(enriched);
    setLoading(false);
  }, [supabase, page, search, tagsMap, selectedListId, listMemberIds]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    if (user) fetchLists();
  }, [user, fetchLists]);

  useEffect(() => {
    if (selectedListId) {
      fetchListMembers(selectedListId);
    } else {
      setListMemberIds(new Set());
    }
  }, [selectedListId, fetchListMembers]);

  useEffect(() => {
    if (!selectedListId || listMemberIds.size > 0) {
      fetchContacts();
    } else if (selectedListId && listMemberIds.size === 0) {
      setContacts([]);
      setTotalCount(0);
      setLoading(false);
    }
  }, [fetchContacts, selectedListId, listMemberIds]);

  useRealtimeTable<Contact>({
    table: 'contacts',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onEvent: (event: RealtimeTableEvent<Contact>) => {
      if (event.eventType === 'INSERT') {
        setTotalCount((prev) => prev + 1);
        if (page === 0 && !search.trim() && !selectedListId) {
          setContacts((prev) => [{ ...event.new, tags: [] }, ...prev]);
        }
      } else if (event.eventType === 'UPDATE') {
        setContacts((prev) =>
          prev.map((c) => (c.id === event.new.id ? { ...c, ...event.new } : c))
        );
      } else if (event.eventType === 'DELETE') {
        setContacts((prev) => prev.filter((c) => c.id !== (event.old as { id: string }).id));
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
    },
  });

  function openAddForm() {
    setEditContact(null);
    setEditContactTags([]);
    setFormOpen(true);
  }

  async function openEditForm(contact: Contact) {
    const { data } = await supabase
      .from('contact_tags')
      .select('*')
      .eq('contact_id', contact.id);
    setEditContact(contact);
    setEditContactTags(data ?? []);
    setFormOpen(true);
  }

  function openDetail(contactId: string) {
    setDetailContactId(contactId);
    setDetailOpen(true);
  }

  function confirmDelete(contact: Contact) {
    setDeleteTarget(contact);
    setDeleteConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      toast.error('Failed to delete contact');
    } else {
      toast.success('Contact deleted');
      fetchContacts();
    }

    setDeleting(false);
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  }

  async function createList() {
    if (!newListName.trim()) return;
    const res = await fetch('/api/contact-lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    if (res.ok) {
      toast.success('List created');
      setNewListName('');
      setNewListOpen(false);
      fetchLists();
    } else {
      toast.error('Failed to create list');
    }
  }

  async function deleteList(lst: ContactList) {
    const res = await fetch(`/api/contact-lists/${lst.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('List deleted');
      if (selectedListId === lst.id) setSelectedListId(null);
      fetchLists();
    } else {
      toast.error('Failed to delete list');
    }
  }

  async function addSelectedToList() {
    if (!addToListTarget || selectedContactIds.size === 0) return;
    const res = await fetch(`/api/contact-lists/${addToListTarget.id}/members`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contact_ids: Array.from(selectedContactIds) }),
    });
    if (res.ok) {
      toast.success(`Added ${selectedContactIds.size} contacts to "${addToListTarget.name}"`);
      setSelectedContactIds(new Set());
      setAddToListOpen(false);
      setAddToListTarget(null);
      fetchLists();
    } else {
      toast.error('Failed to add contacts to list');
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  return (
    <div className="flex gap-6">
      {/* Lists sidebar — collapsible */}
      <div
        className={`hidden lg:flex shrink-0 flex-col gap-2 transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarCollapsed ? 'w-9' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          {!sidebarCollapsed && (
            <h2 className="text-sm font-semibold text-foreground">Lists</h2>
          )}
          <div className="flex items-center gap-0.5">
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setNewListOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="text-muted-foreground hover:text-foreground"
              title={sidebarCollapsed ? 'Expand lists' : 'Collapse lists'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <button
            onClick={() => { setSelectedListId(null); setSelectedContactIds(new Set()); setPage(0); }}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              !selectedListId
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="size-4" />
              All Contacts
            </span>
          </button>
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => { setSelectedListId(null); setSelectedContactIds(new Set()); setPage(0); }}
            className={`flex items-center justify-center rounded-md p-2 transition-colors ${
              !selectedListId
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            title="All Contacts"
          >
            <Users className="size-4" />
          </button>
        )}

        {!sidebarCollapsed && lists.map((lst) => (
          <div
            key={lst.id}
            className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
              selectedListId === lst.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            onClick={() => { setSelectedListId(lst.id); setSelectedContactIds(new Set()); setPage(0); }}
          >
            <span className="flex items-center gap-2 truncate">
              <List className="size-4 shrink-0" />
              <span className="truncate">{lst.name}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground">{listCounts[lst.id] ?? 0}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImportListId(lst.id);
                  setImportListName(lst.name);
                  setImportOpen(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                title={`Import to ${lst.name}`}
              >
                <Upload className="size-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteList(lst); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </div>
        ))}

        {sidebarCollapsed && lists.map((lst) => (
          <button
            key={lst.id}
            onClick={() => { setSelectedListId(lst.id); setSelectedContactIds(new Set()); setPage(0); }}
            className={`flex items-center justify-center rounded-md p-2 transition-colors ${
              selectedListId === lst.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            title={lst.name}
          >
            <List className="size-4" />
          </button>
        ))}

        {!sidebarCollapsed && lists.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-2">
            No lists yet. Click + to create one.
          </p>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedListId ? lists.find((l) => l.id === selectedListId)?.name : 'Contacts'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount > 0 && `${totalCount} contacts.`}
              {selectedContactIds.size > 0 && ` ${selectedContactIds.size} selected.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedContactIds.size > 0 && (
              <Button
                variant="outline"
                onClick={() => setAddToListOpen(true)}
                className="border-border text-foreground hover:bg-accent"
              >
                <ListPlus className="size-4" />
                Add to List
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="border-border text-foreground hover:bg-accent"
            >
              <Upload className="size-4" />
              Import
            </Button>
            <Button
              onClick={openAddForm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="size-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search + select all */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name, phone, or email..."
              className="pl-8 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {contacts.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={selectedContactIds.size === contacts.length && contacts.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedContactIds(new Set(contacts.map((c) => c.id)));
                  } else {
                    setSelectedContactIds(new Set());
                  }
                }}
                className="rounded border-border"
              />
              Select all
            </label>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-10" />
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Email</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Company</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Tags</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-muted-foreground w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading contacts...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {selectedListId ? 'This list is empty.' : search ? 'No contacts match your search.' : 'No contacts yet.'}
                      </p>
                      {!search && !selectedListId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openAddForm}
                          className="mt-2 border-border text-foreground hover:bg-accent"
                        >
                          <Plus className="size-3.5" />
                          Add your first contact
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="border-border hover:bg-background/50 cursor-pointer"
                    onClick={() => openDetail(contact.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={(e) => {
                          setSelectedContactIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(contact.id);
                            else next.delete(contact.id);
                            return next;
                          });
                        }}
                        className="rounded border-border"
                      />
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {contact.name || <span className="text-muted-foreground italic">Unnamed</span>}
                    </TableCell>
                    <TableCell className="text-foreground font-mono text-xs">
                      {contact.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell text-sm">
                      {contact.email || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                      {contact.company || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags && contact.tags.length > 0 ? (
                          contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: tag.color + '20',
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                        {contact.tags && contact.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{contact.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs hidden lg:table-cell">
                      {new Date(contact.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-background border-border"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm(contact);
                            }}
                            className="text-foreground focus:bg-accent focus:text-foreground"
                          >
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-secondary" />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(contact);
                            }}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of{' '}
              {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Form Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editContact}
        contactTags={editContactTags}
        onSaved={() => {
          fetchContacts();
          fetchTags();
        }}
      />

      {/* Contact Detail Sheet */}
      <ContactDetailView
        open={detailOpen}
        onOpenChange={setDetailOpen}
        contactId={detailContactId}
        onUpdated={fetchContacts}
      />

      {/* Import Modal */}
      <ImportModal
        open={importOpen}
        onOpenChange={(v) => {
          setImportOpen(v);
          if (!v) { setImportListId(null); setImportListName(undefined); }
        }}
        onImported={() => {
          fetchContacts();
          fetchLists();
        }}
        listId={importListId}
        listName={importListName}
      />

      {/* New List Dialog */}
      <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
        <DialogContent className="bg-background border-border text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New List</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Organize contacts into groups for targeted broadcasts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. Website Leads, App Users..."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => { if (e.key === 'Enter') createList(); }}
              autoFocus
            />
          </div>
          <DialogFooter className="bg-background border-border">
            <Button
              variant="outline"
              onClick={() => setNewListOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button onClick={createList} disabled={!newListName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to List Dialog */}
      <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
        <DialogContent className="bg-background border-border text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add {selectedContactIds.size} contacts to list</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a list to add the selected contacts to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-60 overflow-y-auto space-y-1">
            {lists.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lists yet. Create one first.
              </p>
            )}
            {lists.map((lst) => (
              <button
                key={lst.id}
                onClick={() => setAddToListTarget(lst)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  addToListTarget?.id === lst.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <List className="size-4" />
                {lst.name}
                <span className="ml-auto text-xs text-muted-foreground">{listCounts[lst.id] ?? 0}</span>
              </button>
            ))}
          </div>
          <DialogFooter className="bg-background border-border">
            <Button
              variant="outline"
              onClick={() => { setAddToListOpen(false); setAddToListTarget(null); }}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button onClick={addSelectedToList} disabled={!addToListTarget}>
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-background border-border text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Contact</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="text-foreground font-medium">
                {deleteTarget?.name || deleteTarget?.phone}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-background border-border">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
