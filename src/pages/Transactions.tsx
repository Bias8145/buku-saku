import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase, Transaction } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Trash2, Edit2, ArrowUpRight, ArrowDownLeft, Search, X, ChevronDown, ChevronUp, Calendar, Tag, FileText, AlignLeft, ShoppingBag, Printer, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { SEO } from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { ReceiptModal } from '../components/ui/ReceiptModal';

interface TransactionItem {
  id: string;
  product_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<TransactionItem[]>([]); 
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null); // State baru untuk loading cetak
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'save' | 'delete';
    data?: any;
  }>({ isOpen: false, type: 'save' });

  const { register, handleSubmit, reset, setValue } = useForm<Partial<Transaction>>();
  const { showToast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const fetchTransactionItems = async (transactionId: string) => {
    setIsLoadingItems(true);
    setExpandedItems([]);
    try {
      const { data, error } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', transactionId);
      
      if (error) throw error;
      if (data) setExpandedItems(data);
      return data;
    } catch (err) {
      console.error("Error fetching items:", err);
      return [];
    } finally {
      setIsLoadingItems(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchTransactionItems(id);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'sales': return 'Penjualan';
      case 'operational': return 'Operasional';
      case 'capital': return 'Modal';
      case 'other': return 'Lainnya';
      default: return cat;
    }
  };

  const handleOpenReceipt = async (tx: Transaction) => {
    setPrintingId(tx.id); // Mulai loading
    try {
      let itemsToPrint: any[] = [];

      // 1. Cek apakah item sudah ada di state expandedItems (jika baris sedang dibuka)
      if (expandedId === tx.id && expandedItems.length > 0) {
        itemsToPrint = expandedItems;
      } else {
        // 2. Jika belum, fetch langsung dari database
        const { data } = await supabase
          .from('transaction_items')
          .select('*')
          .eq('transaction_id', tx.id);
        
        if (data && data.length > 0) itemsToPrint = data;
      }

      // 3. Format item untuk struk
      let formattedItems = itemsToPrint.map(item => ({
        name: item.product_name,
        qty: item.qty,
        price: item.price
      }));

      // 4. FALLBACK: Jika tidak ada item (transaksi manual), pakai deskripsi
      if (formattedItems.length === 0) {
        formattedItems.push({
          name: tx.description || getCategoryLabel(tx.category),
          qty: 1,
          price: tx.amount
        });
      }

      setReceiptData({
        id: tx.id,
        date: tx.date,
        total: tx.amount,
        payment_amount: tx.payment_amount,
        change_amount: tx.change_amount,
        items: formattedItems
      });
      
      setShowReceipt(true);
    } catch (error) {
      showToast("Gagal memuat data struk", "error");
    } finally {
      setPrintingId(null); // Selesai loading
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setValue('type', tx.type);
    setValue('category', tx.category);
    setValue('amount', tx.amount);
    setValue('description', tx.description);
    const dateStr = new Date(tx.date).toISOString().split('T')[0];
    setValue('date', dateStr);
    
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onPreSubmit = (data: any) => {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Mohon masukkan jumlah yang valid", "error");
      return;
    }

    const payload = {
      type: data.type,
      category: data.category,
      amount: amount,
      description: data.description || '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    };
    
    setConfirmState({ isOpen: true, type: 'save', data: payload });
  };

  const handleConfirm = async () => {
    if (confirmState.type === 'save') {
      try {
        let error;
        if (editingId) {
          ({ error } = await supabase
            .from('transactions')
            .update(confirmState.data)
            .eq('id', editingId));
        } else {
          ({ error } = await supabase
            .from('transactions')
            .insert([confirmState.data]));
        }
        
        if (error) {
          showToast(`Gagal menyimpan: ${error.message}`, "error");
        } else {
          fetchTransactions();
          setIsFormOpen(false);
          setEditingId(null);
          reset();
          showToast(editingId ? "Transaksi diperbarui" : "Transaksi berhasil disimpan", "success");
        }
      } catch (err) {
        showToast("Terjadi kesalahan sistem", "error");
      }
    } else if (confirmState.type === 'delete') {
      const { error } = await supabase.from('transactions').delete().eq('id', confirmState.data);
      if (!error) {
        fetchTransactions();
        showToast("Transaksi berhasil dihapus", "success");
      } else {
        showToast("Gagal menghapus transaksi", "error");
      }
    }
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    reset();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <SEO title="Transaksi" description="Kelola pemasukan dan pengeluaran toko Anda." />
      
      <PageHeader 
        title="Transaksi" 
        description="Catat arus kas masuk dan keluar toko."
        action={
          <Button 
            onClick={() => {
              if (isFormOpen && !editingId) {
                handleCancel();
              } else {
                setIsFormOpen(true);
                setEditingId(null);
                reset();
              }
            }} 
            className="w-full md:w-auto shadow-lg shadow-blue-500/20 transition-all"
            variant={isFormOpen && !editingId ? "secondary" : "primary"}
          >
            {isFormOpen && !editingId ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
            {isFormOpen && !editingId ? "Tutup Form" : "Catat Baru"}
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
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm tracking-wide">
                  {editingId ? 'EDIT TRANSAKSI' : 'INPUT TRANSAKSI BARU'}
                </h3>
              </div>
              <form onSubmit={handleSubmit(onPreSubmit)} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipe Transaksi</label>
                    <div className="relative">
                      <select 
                        {...register('type', { required: true })} 
                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                      >
                        <option value="income">Pemasukan (+)</option>
                        <option value="expense">Pengeluaran (-)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kategori</label>
                    <div className="relative">
                      <select 
                        {...register('category', { required: true })} 
                        className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                      >
                        <option value="sales">Penjualan</option>
                        <option value="operational">Operasional</option>
                        <option value="capital">Modal</option>
                        <option value="other">Lainnya</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jumlah (Rp)</label>
                    <input 
                      type="number" 
                      {...register('amount', { required: true })} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-sm" 
                      placeholder="0" 
                    />
                  </div>

                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        {...register('date')} 
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-sm" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catatan (Opsional)</label>
                    <textarea 
                      {...register('description')} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-sm resize-none min-h-[80px]" 
                      placeholder="Tulis detail transaksi di sini..." 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="ghost" onClick={handleCancel}>Batal</Button>
                  <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Simpan Data'}</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {transactions.map((t) => (
          <motion.div 
            layout
            key={t.id} 
            className={cn(
              "bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden",
              expandedId === t.id 
                ? "border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-500/5" 
                : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
            )}
          >
            <div 
              onClick={() => toggleExpand(t.id)}
              className="p-4 flex items-center justify-between cursor-pointer group relative active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-2">
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                  t.type === 'income' 
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" 
                    : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                )}>
                  {t.type === 'income' ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownLeft size={20} strokeWidth={2.5} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {getCategoryLabel(t.category)}
                    </p>
                    
                    {t.description ? (
                      <div className="flex items-center gap-1 px-1.5 py-[1px] rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                        <FileText size={9} className="mb-[1px]" />
                        <span>Memo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-1.5 py-[1px] rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[9px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                        <span>Tanpa Memo</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {format(parseISO(t.date), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className={cn(
                  "font-bold text-sm md:text-base tracking-tight whitespace-nowrap",
                  t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(t);
                    }}
                    className="p-1.5 md:p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all z-10"
                    title="Edit"
                  >
                    <Edit2 size={16} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmState({ isOpen: true, type: 'delete', data: t.id });
                    }}
                    className="p-1.5 md:p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all z-10"
                    title="Hapus"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
                
                <div className="text-slate-300 dark:text-slate-600 pl-1">
                  {expandedId === t.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === t.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 px-4 py-4 md:px-16"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Kategori</p>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Tag size={14} />
                        <span className="capitalize">{getCategoryLabel(t.category)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Tanggal Lengkap</p>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Calendar size={14} />
                        <span>{format(parseISO(t.date), 'EEEE, dd MMMM yyyy, HH:mm', { locale: id })}</span>
                      </div>
                    </div>
                    
                    {/* Bagian Rincian Barang & Tombol Cetak */}
                    <div className="col-span-1 md:col-span-2 mt-2">
                      <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Rincian Transaksi</p>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => handleOpenReceipt(t)}
                            disabled={printingId === t.id}
                            className="h-7 px-3 text-xs gap-1.5"
                          >
                            {printingId === t.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Printer size={12} />
                            )}
                            {printingId === t.id ? 'Memuat...' : 'Cetak Struk'}
                          </Button>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {isLoadingItems ? (
                          <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Memuat rincian...
                          </div>
                        ) : expandedItems.length > 0 ? (
                          <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {expandedItems.map((item) => (
                              <div key={item.id} className="p-3 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                    <ShoppingBag size={14} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wide">{item.product_name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                                      {item.qty} x {formatCurrency(item.price)}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs font-mono">{formatCurrency(item.subtotal)}</p>
                              </div>
                            ))}
                            
                            {/* Tampilkan Info Pembayaran jika ada */}
                            {t.payment_amount !== undefined && t.payment_amount !== null && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-xs border-t-2 border-dashed border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between text-slate-500 mb-1">
                                  <span>TUNAI</span>
                                  <span className="font-mono">{formatCurrency(t.payment_amount)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                  <span>KEMBALI</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(t.change_amount || 0)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Tampilan jika tidak ada item spesifik (misal transaksi manual)
                          <div className="p-4 flex items-center gap-3 text-slate-500">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.description || getCategoryLabel(t.category)}</p>
                              <p className="text-[10px] text-slate-400">Total: {formatCurrency(t.amount)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Isi Memo / Catatan</p>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap break-words">
                        {t.description ? (
                          <div className="flex gap-2">
                            <AlignLeft size={16} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>{t.description}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Tidak ada catatan tambahan.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        
        {transactions.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
              <Search size={24} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada transaksi tercatat.</p>
            <p className="text-slate-400 text-sm mt-1">Mulai dengan mencatat pemasukan atau pengeluaran.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.type === 'save' ? (editingId ? 'Simpan Perubahan?' : 'Simpan Transaksi?') : 'Hapus Transaksi?'}
        message={confirmState.type === 'save' 
          ? 'Pastikan data yang Anda masukkan sudah benar.' 
          : 'Data yang dihapus tidak dapat dikembalikan.'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
        type={confirmState.type === 'delete' ? 'danger' : 'info'}
        confirmText={confirmState.type === 'save' ? 'Simpan' : 'Ya, Hapus'}
        cancelText="Batal"
      />

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        data={receiptData} 
      />
    </div>
  );
};
