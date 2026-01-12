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
  { label: '58mm', width: 58, desc: 'Mobile Printer' },
  { label: '80mm', width: 80, desc: 'Desktop POS' },
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [paperWidth, setPaperWidth] = useState(58); // Default 58mm
  const [showSettings, setShowSettings] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    
    try {
      // Gunakan elemen print yang bersih untuk generate PDF
      const element = printRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2, // Scale 2 cukup tajam dan file lebih kecil
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('receipt-print-content');
          if (el) {
            el.style.display = 'block'; // Pastikan terlihat saat dicapture
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG kompresi 0.8
      const pdfWidth = paperWidth; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight], // Ukuran dinamis sesuai panjang struk
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
        
        {/* === CSS GLOBAL KHUSUS PRINT === */}
        <style>{`
          @media print {
            @page {
              margin: 0;
              size: auto; /* Penting! Biarkan printer mengatur panjang kertas */
            }
            html, body {
              height: auto;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible;
              background: white;
            }
            /* Sembunyikan semua elemen UI aplikasi */
            body > *:not(.print-area-wrapper) {
              display: none !important;
            }
            /* Tampilkan wrapper print */
            .print-area-wrapper {
              display: block !important;
              position: absolute;
              top: 0;
              left: 0;
              width: ${paperWidth}mm; /* Lebar dinamis */
              background: white;
              z-index: 9999;
            }
            /* Reset modal styles */
            .modal-content {
              display: none !important;
            }
          }
        `}</style>

        {/* === MODAL PREVIEW (TAMPILAN LAYAR) === */}
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
                <div className="p-4 bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">Pilih Ukuran Kertas</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PAPER_SIZES.map(size => (
                      <button
                        key={size.width}
                        onClick={() => setPaperWidth(size.width)}
                        className={cn(
                          "flex flex-col items-center p-3 rounded-xl border-2 transition-all relative",
                          paperWidth === size.width 
                            ? "bg-white border-blue-500 shadow-sm" 
                            : "bg-white border-transparent hover:border-slate-200"
                        )}
                      >
                        <span className={cn("font-bold text-sm", paperWidth === size.width ? "text-blue-600" : "text-slate-600")}>{size.label}</span>
                        <span className="text-[10px] text-slate-400">{size.desc}</span>
                        {paperWidth === size.width && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200/50 relative">
            {/* Kertas Struk Visual (Estetik) */}
            <div 
              className="bg-white shadow-lg relative transition-all duration-300"
              style={{ 
                width: `${paperWidth}mm`, 
                minHeight: '200px',
              }}
            >
              {/* Efek Sobekan Kertas Atas */}
              <div className="absolute -top-1 left-0 right-0 h-2 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
              
              {/* Konten Struk */}
              <ReceiptContent data={data} width={paperWidth} />

              {/* Efek Sobekan Kertas Bawah */}
              <div className="absolute -bottom-1 left-0 right-0 h-2 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white p-4 border-t border-slate-200 flex gap-2 shrink-0 z-10">
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

        {/* === HIDDEN PRINT AREA (RAW HTML FOR PRINTER) === */}
        <div className="print-area-wrapper hidden print:block">
          <div ref={printRef} id="receipt-print-content">
             <ReceiptContent data={data} width={paperWidth} isPrintMode />
          </div>
        </div>

      </div>
    </AnimatePresence>
  );
};

// Komponen Konten Struk (Re-usable & Presisi)
const ReceiptContent = ({ data, width, isPrintMode = false }: { data: ReceiptData, width: number, isPrintMode?: boolean }) => {
  // Ukuran font dinamis berdasarkan lebar kertas
  const fontSize = width === 58 ? '10px' : '12px';
  const lineHeight = width === 58 ? '1.2' : '1.3';
  
  return (
    <div 
      className={cn(
        "font-mono text-black leading-tight",
        isPrintMode ? "p-0" : "p-4" // Padding preview vs print
      )} 
      style={{ 
        fontSize, 
        lineHeight,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div className="text-center mb-3">
        <h1 className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: width === 58 ? '14px' : '16px' }}>28 POINT</h1>
        <p className="text-[9px]">Store & Management</p>
        <p className="text-[9px] mt-0.5">Jl. Kali Brantas No. 28, Blitar</p>
      </div>

      {/* Meta */}
      <div className="border-t border-b border-dashed border-black/50 py-1.5 my-2 flex justify-between" style={{ fontSize: width === 58 ? '9px' : '10px' }}>
        <span>{format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
        <span>#{data.id.slice(0, 6).toUpperCase()}</span>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {data.items.map((item, i) => (
          <div key={i}>
            <div className="font-bold truncate mb-0.5">{item.name}</div>
            <div className="flex justify-between pl-2 text-slate-600 print:text-black">
              <span>{item.qty} x {new Intl.NumberFormat('id-ID').format(item.price)}</span>
              <span className="font-medium text-black">{new Intl.NumberFormat('id-ID').format(item.qty * item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-black/50 py-2 space-y-1">
        <div className="flex justify-between font-bold" style={{ fontSize: width === 58 ? '12px' : '14px' }}>
          <span>TOTAL</span>
          <span>{formatCurrency(data.total)}</span>
        </div>
        {data.payment_amount !== undefined && (
          <>
            <div className="flex justify-between pt-1">
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

      {/* Footer */}
      <div className="text-center mt-4 space-y-3">
        <div className="border-t border-b border-dashed border-black/50 py-2">
          <p className="font-bold mb-1" style={{ fontSize: '9px' }}>LAYANAN TERSEDIA:</p>
          <p className="text-[8px] leading-snug text-slate-600 print:text-black">
            Tarik Tunai • Transfer Bank • Pulsa<br/>
            Token Listrik • PDAM • BPJS • Topup
          </p>
        </div>
        <div>
          <p className="font-medium mb-1" style={{ fontSize: '10px' }}>Terima Kasih</p>
          <p className="text-[8px] text-slate-400 print:text-black">Simpan struk ini sebagai bukti pembayaran yang sah</p>
        </div>
        <p className="text-[7px] uppercase pt-2 text-slate-300 print:text-black/50">Powered by Buku Saku App</p>
      </div>
    </div>
  );
};
