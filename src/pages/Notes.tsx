import React, { useState, useEffect } from 'react';
import { supabase, Note } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { Plus, Trash2, Edit2, StickyNote, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { SEO } from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

export const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'save' | 'delete';
    data?: any;
  }>({ isOpen: false, type: 'save' });

  const { showToast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
    if (data) setNotes(data);
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setFormData({ title: note.title, content: note.content });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      showToast("Judul catatan tidak boleh kosong", "error");
      return;
    }
    setConfirmState({ isOpen: true, type: 'save', data: formData });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ title: '', content: '' });
  };

  const handleConfirm = async () => {
    if (confirmState.type === 'save') {
      let error;
      
      if (editingId) {
        ({ error } = await supabase
          .from('notes')
          .update(confirmState.data)
          .eq('id', editingId));
      } else {
        ({ error } = await supabase
          .from('notes')
          .insert([confirmState.data]));
      }

      if (!error) {
        handleCancel();
        fetchNotes();
        showToast(editingId ? "Catatan berhasil diperbarui" : "Catatan berhasil dibuat", "success");
      } else {
        showToast("Gagal menyimpan catatan", "error");
      }
    } else if (confirmState.type === 'delete') {
      const { error } = await supabase.from('notes').delete().eq('id', confirmState.data);
      if (!error) {
        fetchNotes();
        showToast("Catatan berhasil dihapus", "success");
      } else {
        showToast("Gagal menghapus catatan", "error");
      }
    }
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <SEO title="Catatan" description="Simpan ide dan catatan penting usaha Anda." />
      
      <PageHeader 
        title="Catatan" 
        description="Ide, pengingat, dan daftar penting."
        action={
          <Button 
            onClick={() => { 
              if(isFormOpen && !editingId) {
                handleCancel();
              } else {
                setIsFormOpen(true); 
                setEditingId(null); 
                setFormData({ title: '', content: '' }); 
              }
            }} 
            className="w-full md:w-auto shadow-lg shadow-blue-500/20"
            variant={isFormOpen && !editingId ? "secondary" : "primary"}
          >
            {isFormOpen && !editingId ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
            {isFormOpen && !editingId ? "Tutup" : "Buat Catatan"}
          </Button>
        }
      />

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 shadow-lg shadow-amber-500/5 mb-8">
              <div className="p-6">
                <input
                  className="w-full bg-transparent text-xl font-bold placeholder:text-amber-400/50 dark:placeholder:text-amber-600/50 text-slate-900 dark:text-white outline-none mb-4"
                  placeholder="Judul Catatan..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                />
                <textarea
                  className="w-full bg-transparent resize-none outline-none min-h-[150px] text-slate-700 dark:text-slate-300 text-base leading-relaxed placeholder:text-slate-400/50"
                  placeholder="Tulis isi catatan di sini..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-amber-100 dark:border-amber-900/30">
                  <Button variant="ghost" onClick={handleCancel} className="hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-100">
                    Batal
                  </Button>
                  <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 border-none">
                    {editingId ? 'Simpan Perubahan' : 'Simpan Catatan'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {notes.map((note) => (
          <motion.div 
            layout
            key={note.id} 
            className={cn(
              "relative group flex flex-col transition-all duration-300 border bg-white dark:bg-slate-900 p-5 rounded-2xl overflow-hidden",
              expandedId === note.id 
                ? "col-span-1 md:col-span-2 lg:col-span-3 border-amber-200 dark:border-amber-900/50 shadow-xl shadow-amber-500/10 z-10" 
                : "border-slate-200 dark:border-slate-800 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1"
            )}
          >
            {/* Action Buttons - Always visible & High Z-Index */}
            <div className="absolute top-4 right-4 flex gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg z-30 p-1 shadow-sm border border-slate-100 dark:border-slate-800">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(note); }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                title="Edit"
              >
                <Edit2 size={14} strokeWidth={2} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setConfirmState({ isOpen: true, type: 'delete', data: note.id }); }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Hapus"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="p-2 mb-3 w-fit rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
               <StickyNote size={18} />
            </div>

            {/* Judul dengan word-break agar tidak jebol */}
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 pr-20 leading-tight break-words">
              {note.title}
            </h3>
            
            {/* Konten dengan whitespace-pre-wrap dan break-words */}
            <div className={cn(
              "text-slate-600 dark:text-slate-400 text-sm leading-relaxed break-words whitespace-pre-wrap", 
              !expandedId && "line-clamp-3"
            )}>
              {note.content}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-medium text-slate-400">
                {format(parseISO(note.created_at), 'dd MMM yyyy', { locale: id })}
              </span>
              <button 
                onClick={() => toggleExpand(note.id)}
                className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 z-20"
              >
                {expandedId === note.id ? 'Tutup' : 'Baca'}
                {expandedId === note.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </motion.div>
        ))}
        
        {notes.length === 0 && !isFormOpen && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
            <StickyNote size={40} className="mb-4 text-slate-200 dark:text-slate-700" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Belum ada catatan</p>
            <p className="text-sm mt-1">Buat catatan baru untuk memulai</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.type === 'save' ? (editingId ? 'Simpan Perubahan?' : 'Simpan Catatan?') : 'Hapus Catatan?'}
        message={confirmState.type === 'save' 
          ? 'Pastikan isi catatan sudah sesuai keinginan Anda.' 
          : 'Catatan yang dihapus tidak dapat dikembalikan lagi.'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
        type={confirmState.type === 'delete' ? 'danger' : 'info'}
        confirmText={confirmState.type === 'save' ? 'Ya, Simpan' : 'Ya, Hapus'}
        cancelText="Batal"
      />
    </div>
  );
};
