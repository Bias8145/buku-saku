import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Share2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

interface ReceiptData {
  id: string;
  date: string;
  total: number;
  payment_amount?: number; // Baru
  change_amount?: number;  // Baru
  items: ReceiptItem[];
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptText = () => {
    const dateStr = format(new Date(data.date), 'dd/MM/yyyy HH:mm', { locale: id });
    let text = `*28 POINT*\n`;
    text += `Struk Belanja\n`;
    text += `--------------------------------\n`;
    text += `Tgl: ${dateStr}\n`;
    text += `No : ${data.id.slice(0, 8).toUpperCase()}\n`;
    text += `--------------------------------\n`;
    
    data.items.forEach(item => {
      text += `${item.name}\n`;
      text += `${item.qty} x ${formatCurrency(item.price)} = ${formatCurrency(item.qty * item.price)}\n`;
    });
    
    text += `--------------------------------\n`;
    text += `TOTAL   : ${formatCurrency(data.total)}\n`;
    if (data.payment_amount !== undefined && data.change_amount !== undefined) {
      text += `TUNAI   : ${formatCurrency(data.payment_amount)}\n`;
      text += `KEMBALI : ${formatCurrency(data.change_amount)}\n`;
    }
    text += `--------------------------------\n`;
    text += `Terima kasih telah berbelanja!\n`;
    text += `Barang tidak dapat ditukar.\n`;
    
    return text;
  };

  const handleShare = async () => {
    const text = generateReceiptText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Struk Belanja 28 POINT',
          text: text,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Struk disalin ke clipboard!", "success");
      } catch (err) {
        showToast("Gagal menyalin struk", "error");
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0 print:block">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white text-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:w-full print:max-w-none print:rounded-none"
        >
          {/* Header Actions (Hidden when printing) */}
          <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-100 print:hidden">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Transaksi Sukses
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Receipt Content */}
          <div className="p-8 font-mono text-sm leading-relaxed print:p-0" id="receipt-area">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black uppercase tracking-widest mb-1">28 POINT</h2>
              <p className="text-xs text-slate-500">Store & Management</p>
              
              <div className="mt-4 text-xs text-slate-400 flex justify-between border-t border-b border-dashed border-slate-200 py-2">
                 <span>NO: {data.id.slice(0, 8).toUpperCase()}</span>
                 <span>{format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
              </div>
            </div>

            <div className="space-y-3 min-h-[50px]">
              {data.items.map((item, index) => (
                <div key={index} className="flex flex-col border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <p className="font-bold truncate text-slate-800">{item.name}</p>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{item.qty} x {formatCurrency(item.price)}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.qty * item.price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-slate-800 my-4" />

            {/* Rincian Pembayaran */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xl font-black text-slate-900">
                <span>TOTAL</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
              
              {data.payment_amount !== undefined && data.change_amount !== undefined && (
                <>
                  <div className="flex justify-between items-center text-sm text-slate-600 mt-2">
                    <span>TUNAI</span>
                    <span>{formatCurrency(data.payment_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>KEMBALI</span>
                    <span className="font-bold">{formatCurrency(data.change_amount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-b-2 border-dashed border-slate-300 my-4" />

            <div className="text-center text-xs text-slate-400 mt-6 print:mt-8 space-y-1">
              <p className="font-bold text-slate-600">TERIMA KASIH</p>
              <p>Barang yang sudah dibeli</p>
              <p>tidak dapat ditukar/dikembalikan.</p>
            </div>
            
            <div className="hidden print:block text-center text-[8px] text-slate-300 mt-6 uppercase tracking-wider">
              Powered by Buku Saku App
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 print:hidden">
            <Button variant="secondary" className="flex-1" onClick={handlePrint}>
              <Printer size={18} className="mr-2" />
              Print
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleShare}>
              <Share2 size={18} className="mr-2" />
              Share
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
