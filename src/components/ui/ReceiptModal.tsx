import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Share2, CheckCircle2, FileDown, Loader2, Settings2, ChevronDown } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

interface ReceiptData {
  id: string;
  date: string;
  total: number;
  payment_amount?: number;
  change_amount?: number;
  items: ReceiptItem[];
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

const PAPER_SIZES = [
  { label: '58mm (Mobile/Mini)', width: 58 },
  { label: '80mm (Desktop/POS)', width: 80 },
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [paperWidth, setPaperWidth] = useState(58);
  const [showSettings, setShowSettings] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);
    
    try {
      // Clone elemen untuk PDF agar bersih dari style layar
      const element = receiptRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3, // Resolusi tinggi
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('receipt-content');
          if (el) {
            el.style.padding = '10px'; // Padding aman untuk PDF
            el.style.height = 'auto';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdfWidth = paperWidth; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        compress: true 
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Struk-28POINT-${data.id.slice(0, 8)}.pdf`);
      showToast("PDF berhasil disimpan", "success");
    } catch (error) {
      console.error(error);
      showToast("Gagal membuat PDF", "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateReceiptText = () => {
    const dateStr = format(new Date(data.date), 'dd/MM/yyyy HH:mm', { locale: id });
    const line = "-".repeat(32);
    
    let text = `28 POINT\n`;
    text += `Store & Management\n`;
    text += `${line}\n`;
    text += `Tgl : ${dateStr}\n`;
    text += `No  : ${data.id.slice(0, 8).toUpperCase()}\n`;
    text += `${line}\n`;
    
    data.items.forEach(item => {
      text += `${item.name}\n`;
      const subtotal = item.qty * item.price;
      text += `${item.qty} x ${formatCurrency(item.price)} = ${formatCurrency(subtotal)}\n`;
    });
    
    text += `${line}\n`;
    text += `TOTAL   : ${formatCurrency(data.total)}\n`;
    if (data.payment_amount !== undefined) {
      text += `TUNAI   : ${formatCurrency(data.payment_amount)}\n`;
      text += `KEMBALI : ${formatCurrency(data.change_amount || 0)}\n`;
    }
    text += `${line}\n`;
    text += `Terima Kasih\n`;
    return text;
  };

  const handleShare = async () => {
    const text = generateReceiptText();
    if (navigator.share) {
      try { await navigator.share({ title: 'Struk 28 POINT', text }); } 
      catch (err) { console.log(err); }
    } else {
      navigator.clipboard.writeText(text);
      showToast("Teks struk disalin", "success");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
        
        {/* === CSS KHUSUS PRINT (Global Style Injection) === */}
        <style>{`
          @media print {
            @page {
              margin: 0;
              size: auto; /* Biarkan printer mengatur panjang kertas */
            }
            body {
              background: white;
              margin: 0;
              padding: 0;
            }
            /* Sembunyikan SEMUA elemen kecuali area struk */
            body > *:not(.print-area-wrapper) {
              display: none !important;
            }
            /* Tampilkan wrapper print */
            .print-area-wrapper {
              display: block !important;
              position: absolute;
              top: 0;
              left: 0;
              width: ${paperWidth}mm; /* Lebar dinamis sesuai setting */
              margin: 0;
              padding: 0;
              background: white;
            }
            /* Reset style modal agar tidak mengganggu */
            .modal-content {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: none !important;
            }
            /* Sembunyikan tombol saat print */
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* === MODAL CONTAINER (Screen View) === */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-100 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] modal-content print:hidden"
        >
          {/* Header */}
          <div className="bg-white p-4 flex justify-between items-center border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <span>Transaksi Berhasil</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}>
                <Settings2 size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-white border-b border-slate-200 overflow-hidden">
                <div className="p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ukuran Kertas</p>
                  <div className="flex gap-2">
                    {PAPER_SIZES.map(size => (
                      <button
                        key={size.width}
                        onClick={() => setPaperWidth(size.width)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                          paperWidth === size.width ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200/50">
            {/* Kertas Struk Visual */}
            <div 
              className="bg-white shadow-sm"
              style={{ 
                width: `${paperWidth}mm`, 
                minHeight: '200px',
                padding: '0', // Padding 0 agar presisi saat print
              }}
            >
              {/* Konten Struk yang sama persis dengan Print */}
              <ReceiptContent data={data} />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white p-4 border-t border-slate-200 flex gap-2 shrink-0">
            <Button variant="secondary" className="flex-1" onClick={handlePrint}>
              <Printer size={16} className="mr-2" /> Print
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleSavePdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={16}/> : <FileDown size={16} className="mr-2" />} PDF
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleShare}>
              <Share2 size={16} className="mr-2" /> Share
            </Button>
          </div>
        </motion.div>

        {/* === HIDDEN PRINT AREA (Hanya muncul saat CTRL+P) === */}
        <div className="print-area-wrapper hidden print:block">
          <div ref={receiptRef} id="receipt-content">
             <ReceiptContent data={data} />
          </div>
        </div>

      </div>
    </AnimatePresence>
  );
};

// Komponen Konten Struk Terpisah (Re-usable untuk Preview & Print)
const ReceiptContent = ({ data }: { data: ReceiptData }) => {
  return (
    <div className="font-mono text-black leading-tight" style={{ fontSize: '10px', padding: '10px 5px' }}>
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-base font-bold uppercase tracking-wider mb-1">28 POINT</h1>
        <p className="text-[9px]">Store & Management</p>
        <p className="text-[9px] mt-1">Jl. Kali Brantas No. 28, Blitar</p>
      </div>

      {/* Meta */}
      <div className="border-t border-b border-dashed border-black py-1 my-2 text-[9px] flex justify-between">
        <span>{format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
        <span>#{data.id.slice(0, 6).toUpperCase()}</span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-2">
        {data.items.map((item, i) => (
          <div key={i}>
            <div className="font-bold truncate">{item.name}</div>
            <div className="flex justify-between">
              <span>{item.qty} x {new Intl.NumberFormat('id-ID').format(item.price)}</span>
              <span>{new Intl.NumberFormat('id-ID').format(item.qty * item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-black py-1 space-y-1">
        <div className="flex justify-between font-bold text-xs">
          <span>TOTAL</span>
          <span>{formatCurrency(data.total)}</span>
        </div>
        {data.payment_amount !== undefined && (
          <>
            <div className="flex justify-between">
              <span>TUNAI</span>
              <span>{formatCurrency(data.payment_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>KEMBALI</span>
              <span>{formatCurrency(data.change_amount || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Promo & Footer */}
      <div className="text-center mt-3 space-y-2">
        <div className="border-t border-b border-dashed border-black py-1">
          <p className="font-bold text-[9px]">LAYANAN KAMI:</p>
          <p className="text-[8px] leading-snug">
            Tarik Tunai • Transfer • Pulsa<br/>
            Listrik • PDAM • BPJS • Topup
          </p>
        </div>
        <p className="text-[9px]">Terima Kasih</p>
        <p className="text-[7px] uppercase pt-2">Powered by Buku Saku App</p>
      </div>
    </div>
  );
};
