import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase, Product } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Trash2, Edit2, Package, Search, X, ChevronDown, ChevronUp, Barcode, TrendingUp } from 'lucide-react';
import { SEO } from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

export const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'save' | 'delete';
    data?: any;
  }>({ isOpen: false, type: 'save' });

  const { register, handleSubmit, reset, setValue } = useForm<Partial<Product>>();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts(data);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setValue('name', product.name);
    setValue('buy_price', product.buy_price);
    setValue('sell_price', product.sell_price);
    setValue('stock', product.stock);
    setValue('sku', product.sku);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onPreSubmit = (data: any) => {
    const payload = {
      ...data,
      buy_price: Number(data.buy_price),
      sell_price: Number(data.sell_price),
      stock: Number(data.stock),
    };
    setConfirmState({ isOpen: true, type: 'save', data: payload });
  };

  const handleConfirm = async () => {
    if (confirmState.type === 'save') {
      const payload = confirmState.data;
      let error;
      
      if (editingId) {
        ({ error } = await supabase.from('products').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('products').insert([payload]));
      }

      if (!error) {
        fetchProducts();
        setIsFormOpen(false);
        setEditingId(null);
        reset();
        showToast(editingId ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan", "success");
      } else {
        showToast("Gagal menyimpan produk", "error");
      }
    } else if (confirmState.type === 'delete') {
      const { error } = await supabase.from('products').delete().eq('id', confirmState.data);
      if (!error) {
        fetchProducts();
        showToast("Produk berhasil dihapus", "success");
      } else {
        showToast("Gagal menghapus produk", "error");
      }
    }
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      <SEO title="Stok Barang" description="Kelola inventaris dan stok barang toko Anda." />
      
      <PageHeader 
        title="Stok Barang" 
        description="Kelola inventaris produk dan harga."
        action={
          <Button 
            onClick={() => { 
              if(isFormOpen && !editingId) {
                setIsFormOpen(false);
              } else {
                setIsFormOpen(true); 
                setEditingId(null); 
                reset(); 
              }
            }} 
            className="w-full md:w-auto shadow-lg shadow-blue-500/20"
            variant={isFormOpen && !editingId ? "secondary" : "primary"}
          >
            {isFormOpen && !editingId ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
            {isFormOpen && !editingId ? "Tutup" : "Tambah Produk"}
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
                 <h3 className="font-bold text-slate-800 dark:text-white text-sm tracking-wide">{editingId ? 'EDIT PRODUK' : 'TAMBAH PRODUK BARU'}</h3>
              </div>
              <form onSubmit={handleSubmit(onPreSubmit)} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Produk</label>
                    <input 
                      type="text" 
                      {...register('name', { required: true })} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm" 
                      placeholder="Contoh: Beras Premium 5kg" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Harga Modal</label>
                    <input 
                      type="number" 
                      {...register('buy_price', { required: true })} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Harga Jual</label>
                    <input 
                      type="number" 
                      {...register('sell_price', { required: true })} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stok Saat Ini</label>
                    <input 
                      type="number" 
                      {...register('stock', { required: true })} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kode SKU (Opsional)</label>
                    <input 
                      type="text" 
                      {...register('sku')} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm" 
                      placeholder="KODE-123" 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
                  <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Cari nama barang atau SKU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-5 py-4 pl-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => (
          <motion.div 
            layout
            key={p.id} 
            className={cn(
              "bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden",
              expandedId === p.id 
                ? "border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/10 col-span-1 md:col-span-2 lg:col-span-3" 
                : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
            )}
          >
            <div 
              onClick={() => toggleExpand(p.id)}
              className="p-5 flex items-start justify-between cursor-pointer group relative active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                  <Package size={24} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 truncate pr-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1">
                    {p.sku ? <><Barcode size={12}/> {p.sku}</> : 'NO SKU'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Always Visible Actions with High Z-Index */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(p); }} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors z-10"
                >
                  <Edit2 size={18} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setConfirmState({ isOpen: true, type: 'delete', data: p.id }); }} 
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors z-10"
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </button>
                {/* Chevron Indicator - Visible on Mobile too */}
                <div className="text-slate-300 dark:text-slate-600 ml-1">
                  {expandedId === p.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {/* Compact Info Row (Visible when collapsed) */}
            {!expandedId && (
              <div className="px-5 pb-5 pt-0 flex justify-between items-end">
                 <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Stok</p>
                    <p className={`font-bold text-base ${p.stock < 5 ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>{p.stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Harga Jual</p>
                    <p className="font-bold text-base text-blue-600 dark:text-blue-400">{formatCurrency(p.sell_price)}</p>
                  </div>
              </div>
            )}

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedId === p.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 px-6 py-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Stok Tersedia</p>
                      <p className={`text-2xl font-bold ${p.stock < 5 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{p.stock} <span className="text-sm font-normal text-slate-400">Unit</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Harga Modal</p>
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(p.buy_price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Harga Jual</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(p.sell_price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Estimasi Laba</p>
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        <TrendingUp size={18} />
                        {formatCurrency(p.sell_price - p.buy_price)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            Tidak ada produk ditemukan.
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.type === 'save' ? 'Simpan Produk?' : 'Hapus Produk?'}
        message={confirmState.type === 'save' 
          ? 'Pastikan detail produk sudah sesuai.' 
          : 'Produk akan dihapus permanen dari database.'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
        type={confirmState.type === 'delete' ? 'danger' : 'info'}
        confirmText={confirmState.type === 'save' ? 'Simpan' : 'Hapus'}
        cancelText="Batal"
      />
    </div>
  );
};
