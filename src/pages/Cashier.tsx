import React, { useState, useEffect, useRef } from 'react';
import { supabase, Product } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ScanBarcode, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  PackageOpen,
  X,
  ChevronUp,
  Camera
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Tipe data untuk item di keranjang
interface CartItem extends Product {
  qty: number;
}

export const Cashier = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // State khusus Mobile
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const { showToast } = useToast();

  useEffect(() => {
    fetchProducts();
    
    // Cleanup scanner saat unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  // Effect untuk Scanner
  useEffect(() => {
    if (showScanner) {
      // Delay sedikit agar elemen DOM #reader tersedia
      const timer = setTimeout(() => {
        const onScanSuccess = (decodedText: string) => {
            handleSearch({ target: { value: decodedText } } as any);
            setShowScanner(false);
            showToast(`Barcode terdeteksi: ${decodedText}`, "success");
            if (scannerRef.current) {
              scannerRef.current.clear().catch(console.error);
            }
        };

        const onScanFailure = (error: any) => {
            // console.warn(`Code scan error = ${error}`);
        };

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      }, 100);

      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }
  }, [showScanner]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts(data);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    const exactMatch = products.find(p => p.sku && p.sku.toLowerCase() === value.toLowerCase());
    if (exactMatch) {
      addToCart(exactMatch);
      setSearchTerm('');
      // Jika di mobile, beri feedback visual
      showToast(`${exactMatch.name} ditambahkan`, "success");
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`Stok ${product.name} habis!`, "error");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          showToast("Stok tidak mencukupi", "error");
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty > item.stock) {
          showToast("Mencapai batas stok", "error");
          return item;
        }
        return { ...item, qty: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    if (cart.length <= 1) setIsMobileCartOpen(false);
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (item.sell_price * item.qty), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    try {
      const totalAmount = calculateTotal();
      const date = new Date().toISOString();

      // 1. Simpan Transaksi Utama
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert([{
          type: 'income',
          category: 'sales',
          amount: totalAmount,
          description: `Penjualan Kasir: ${cart.length} item`,
          date: date
        }])
        .select()
        .single();

      if (txError) throw txError;

      // 2. Simpan Detail Item
      const itemsPayload = cart.map(item => ({
        transaction_id: txData.id,
        product_id: item.id,
        product_name: item.name,
        qty: item.qty,
        price: item.sell_price,
        subtotal: item.qty * item.sell_price
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsPayload);

      if (itemsError) console.error("Gagal simpan detail item:", itemsError);
      
      // 3. Update Stok Produk
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.stock - item.qty })
          .eq('id', item.id);
        
        if (stockError) console.error("Gagal update stok", stockError);
      }

      setReceiptData({
        id: txData.id,
        date: date,
        total: totalAmount,
        items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.sell_price }))
      });
      setShowReceipt(true);
      
      setCart([]);
      setIsMobileCartOpen(false);
      fetchProducts(); 
    } catch (error: any) {
      showToast(`Gagal Checkout: ${error.message}`, "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Komponen Keranjang (Reusable)
  const CartContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header Keranjang */}
      <div className={cn(
        "p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center",
        isMobile && "pt-2" 
      )}>
        <div className="flex items-center gap-3">
          <ShoppingCart className="text-blue-600 dark:text-blue-400" size={20} />
          <h3 className="font-bold text-slate-800 dark:text-white">Keranjang</h3>
        </div>
        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg">{cart.reduce((a, c) => a + c.qty, 0)} Item</span>
      </div>

      {/* List Item */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {cart.length > 0 ? (
          cart.map((item) => (
            <motion.div 
              layout
              key={item.id} 
              className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{item.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(item.sell_price)}</p>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => item.qty > 1 ? updateQty(item.id, -1) : removeFromCart(item.id)}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-colors text-slate-600 dark:text-slate-300"
                >
                  {item.qty === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />}
                </button>
                <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                <button 
                  onClick={() => updateQty(item.id, 1)}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-colors text-blue-600 dark:text-blue-400"
                >
                  <Plus size={14} />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
            <ShoppingCart size={48} strokeWidth={1} />
            <p className="text-sm">Keranjang kosong</p>
          </div>
        )}
      </div>

      {/* Footer Checkout */}
      <div className={cn(
        "p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-4",
        isMobile && "pb-8" // Extra padding for mobile bottom safe area
      )}>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Total Tagihan</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(calculateTotal())}</span>
        </div>
        
        <Button 
          onClick={handleCheckout}
          disabled={cart.length === 0 || isCheckingOut}
          className="w-full py-4 text-base rounded-xl shadow-lg shadow-blue-500/20"
          isLoading={isCheckingOut}
        >
          <CreditCard size={20} className="mr-2" />
          Bayar Sekarang
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 md:h-[calc(100vh-100px)]">
      <SEO title="Kasir" description="Point of Sales aplikasi Buku Saku." />
      
      {/* KIRI: Katalog Produk */}
      {/* Mobile: Full Height scroll normal. Desktop: Flex-1 */}
      <div className="flex-1 flex flex-col min-h-0 pb-32 md:pb-0">
        <PageHeader 
          title="Kasir" 
          description="Scan barcode atau pilih produk."
          className="mb-6"
        />

        {/* Search & Scan Bar */}
        <div className="flex gap-3 mb-6 sticky top-0 z-20 bg-[#F8FAFC] dark:bg-[#020617] py-2">
          <div className="relative flex-1">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Cari nama atau Scan Barcode..." 
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-5 py-4 pl-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
          <Button 
            onClick={() => setShowScanner(!showScanner)}
            className={`px-4 rounded-2xl ${showScanner ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 dark:bg-slate-800'} text-white`}
            title={showScanner ? "Tutup Scanner" : "Buka Kamera Scanner"}
          >
            {showScanner ? <X size={20} /> : <ScanBarcode size={20} />}
          </Button>
        </div>

        {/* Area Scanner Kamera (Real) */}
        <AnimatePresence>
          {showScanner && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 bg-slate-900 rounded-2xl overflow-hidden relative p-4"
            >
              <div className="flex items-center gap-2 text-white/80 mb-3 text-xs justify-center bg-white/10 py-2 rounded-lg">
                <Camera size={16} />
                <span>Izinkan akses kamera saat diminta browser</span>
              </div>
              <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-slate-700"></div>
              <p className="text-center text-slate-400 text-xs mt-2">Arahkan kamera ke barcode produk</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid Produk */}
        <div className="flex-1 md:overflow-y-auto custom-scrollbar pr-0 md:pr-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredProducts.map((p) => (
              <motion.div
                key={p.id}
                layout
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(p)}
                className={cn(
                  "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all group relative overflow-hidden shadow-sm",
                  p.stock <= 0 && "opacity-60 grayscale pointer-events-none"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                    <PackageOpen size={18} strokeWidth={1.5} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg",
                    p.stock > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700"
                  )}>
                    {p.stock > 0 ? `${p.stock}` : '0'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 line-clamp-2 min-h-[40px] leading-tight">{p.name}</h3>
                <p className="text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(p.sell_price)}</p>
                
                {/* Add Overlay (Desktop Only) */}
                <div className="hidden md:flex absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
                  <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <Plus size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              Produk tidak ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* KANAN: Keranjang (Desktop Mode) - HIDDEN ON MOBILE */}
      <div className="hidden md:flex w-[380px] flex-col h-full sticky top-0">
        <Card className="flex-1 flex flex-col overflow-hidden border-blue-100 dark:border-slate-800 shadow-2xl shadow-blue-900/5 p-0">
          <CartContent />
        </Card>
      </div>

      {/* MOBILE FLOATING CART BAR - VISIBLE ON MOBILE ONLY */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="md:hidden fixed bottom-28 left-4 right-4 z-40"
          >
            <div 
              onClick={() => setIsMobileCartOpen(true)}
              className="bg-slate-900/90 dark:bg-blue-600/90 backdrop-blur-lg text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-300 dark:text-blue-100 font-medium">{cart.reduce((a,c) => a + c.qty, 0)} Barang</p>
                  <p className="font-bold text-lg leading-none">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-3 py-2 rounded-xl">
                Lihat <ChevronUp size={16} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE CART DRAWER (Popup) */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileCartOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] z-[70] h-[90vh] flex flex-col shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.2)]"
            >
              {/* Handle Bar Area */}
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                 <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2" />
                 <div /> {/* Spacer */}
                 <button 
                   onClick={() => setIsMobileCartOpen(false)} 
                   className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                 >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col relative">
                <CartContent isMobile={true} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        data={receiptData} 
      />
    </div>
  );
};
