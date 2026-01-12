import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Share2, CheckCircle2, FileDown, Loader2, Settings2, ChevronDown, Receipt as ReceiptIcon } from 'lucide-react';
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

// Referensi Ukuran Kertas Lengkap
const PAPER_SIZES = [
  { id: '57mm', width: 57, label: '57mm', desc: 'Mesin EDC / Printer Mini' },
  { id: '58mm', width: 58, label: '58mm', desc: 'Printer Mobile (Standar)' },
  { id: '76mm', width: 76, label: '76mm', desc: 'Printer Dot Matrix' },
  { id: '80mm', width: 80, label: '80mm', desc: 'POS Desktop / Supermarket' },
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [paperWidth, setPaperWidth] = useState(58); // Default 58mm
  const [showSettings, setShowSettings] = useState(false);
  
  // Ref untuk elemen yang akan di-capture (PDF) dan di-print
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    // Browser print dialog akan menggunakan CSS @media print
    window.print();
  };

  const handleSavePdf = async () => {
    if (!printContentRef.current) return;
    setIsGeneratingPdf(true);
    
    try {
      const element = printContentRef.current;
      
      // Tunggu sebentar agar rendering stabil
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Resolusi tinggi
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth, // Pastikan capture sesuai lebar konten
        height: element.scrollHeight // Capture seluruh panjang
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdfWidth = paperWidth; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight], // Ukuran PDF dinamis sesuai panjang struk
        compress: true 
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Struk-28POINT-${data.id.slice(0, 8)}.pdf`);
      showToast("PDF berhasil disimpan", "success");
    } catch (error) {
      console.error("PDF Error:", error);
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:hidden">
        
        {/* === MODAL PREVIEW (UI) === */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-100 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                <CheckCircle2 size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Transaksi Berhasil</h3>
                <p className="text-[10px] text-slate-500 font-medium">Siap dicetak atau dibagikan</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`p-2 rounded-xl transition-all ${showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                title="Pengaturan Kertas"
              >
                <Settings2 size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Settings Panel (Collapsible) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="bg-white border-b border-slate-200 overflow-hidden"
              >
                <div className="p-5 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <ReceiptIcon size={14} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Ukuran Kertas</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {PAPER_SIZES.map(size => (
                      <button
                        key={size.id}
                        onClick={() => setPaperWidth(size.width)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all text-left relative overflow-hidden",
                          paperWidth === size.width 
                            ? "bg-white border-blue-500 shadow-md shadow-blue-500/10 z-10" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                          paperWidth === size.width ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {size.label}
                        </div>
                        <div>
                          <p className={cn("font-bold text-sm", paperWidth === size.width ? "text-slate-800" : "text-slate-600")}>
                            {size.desc}
                          </p>
                          <p className="text-[10px] text-slate-400">Lebar {size.width}mm</p>
                        </div>
                        {paperWidth === size.width && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#e2e8f0] relative flex justify-center items-start shadow-inner">
            {/* Kertas Struk Visual */}
            <div 
              className="bg-white shadow-2xl relative transition-all duration-300 shrink-0"
              style={{ 
                width: `${paperWidth}mm`, 
                minHeight: '200px',
                transform: 'scale(1)', // Bisa ditambahkan fitur zoom nanti
                transformOrigin: 'top center'
              }}
            >
              {/* Tekstur Kertas Halus */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-30 pointer-events-none mix-blend-multiply"></div>

              {/* Efek Sobekan Atas */}
              <div className="absolute -top-1.5 left-0 right-0 h-3 bg-white" style={{ 
                maskImage: 'linear-gradient(45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%), linear-gradient(-45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%)',
                maskSize: '12px 20px',
                WebkitMaskImage: 'linear-gradient(45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%), linear-gradient(-45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%)',
                WebkitMaskSize: '12px 20px',
                transform: 'rotate(180deg)'
              }}></div>
              
              {/* Konten Struk */}
              <div className="relative z-10">
                <ReceiptContent data={data} width={paperWidth} />
              </div>

              {/* Efek Sobekan Bawah */}
              <div className="absolute -bottom-1.5 left-0 right-0 h-3 bg-white" style={{ 
                maskImage: 'linear-gradient(45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%), linear-gradient(-45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%)',
                maskSize: '12px 20px',
                WebkitMaskImage: 'linear-gradient(45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%), linear-gradient(-45deg, transparent 33.33%, #000 33.33%, #000 66.67%, transparent 66.67%)',
                WebkitMaskSize: '12px 20px'
              }}></div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white p-4 border-t border-slate-200 flex gap-3 shrink-0 z-20 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
            <Button variant="primary" className="flex-1 shadow-blue-500/20" onClick={handlePrint}>
              <Printer size={18} className="mr-2" /> Print
            </Button>
            <Button variant="secondary" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={handleSavePdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={18}/> : <FileDown size={18} className="mr-2" />} PDF
            </Button>
            <Button variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4" onClick={handleShare} title="Share Text">
              <Share2 size={18} />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* === HIDDEN PRINT AREA (PORTAL) === */}
      {/* Ini adalah kunci agar print tidak blank. Kita render langsung ke body, di luar modal */}
      {createPortal(
        <div className="print-portal">
          <style>{`
            @media print {
              @page {
                margin: 0;
                size: auto;
              }
              body {
                background: white;
              }
              /* Sembunyikan semua konten aplikasi */
              body > *:not(.print-portal) {
                display: none !important;
              }
              /* Tampilkan hanya portal print */
              .print-portal {
                display: block !important;
                position: absolute;
                top: 0;
                left: 0;
                width: auto;
                height: auto;
                background: white;
                z-index: 9999;
              }
            }
            /* Sembunyikan portal di layar normal */
            @media screen {
              .print-portal {
                display: none;
              }
            }
          `}</style>
          
          {/* Container untuk Print & PDF Capture */}
          <div 
            ref={printContentRef} 
            style={{ 
              width: `${paperWidth}mm`,
              backgroundColor: 'white',
              padding: 0,
              margin: 0
            }}
          >
            <ReceiptContent data={data} width={paperWidth} isPrintMode />
          </div>
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
};

// Komponen Konten Struk (Re-usable & Presisi)
const ReceiptContent = ({ data, width, isPrintMode = false }: { data: ReceiptData, width: number, isPrintMode?: boolean }) => {
  // Ukuran font dinamis berdasarkan lebar kertas
  const fontSize = width < 60 ? '10px' : '12px';
  const lineHeight = width < 60 ? '1.2' : '1.3';
  const padding = isPrintMode ? '0px' : '16px';
  
  return (
    <div 
      className="font-mono text-black leading-tight"
      style={{ 
        fontSize, 
        lineHeight,
        padding,
        width: '100%',
        boxSizing: 'border-box',
        color: '#000000' // Pastikan hitam pekat untuk print
      }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="font-bold uppercase tracking-wider mb-1" style={{ fontSize: width < 60 ? '14px' : '16px' }}>28 POINT</h1>
        <p className="text-[9px]">Store & Management</p>
        <p className="text-[9px] mt-0.5">Jl. Kali Brantas No. 28, Blitar</p>
      </div>

      {/* Meta */}
      <div className="border-t border-b border-dashed border-black/50 py-2 my-2 flex justify-between" style={{ fontSize: width < 60 ? '9px' : '10px' }}>
        <span>{format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
        <span>#{data.id.slice(0, 6).toUpperCase()}</span>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {data.items.map((item, i) => (
          <div key={i}>
            <div className="font-bold truncate mb-0.5">{item.name}</div>
            <div className="flex justify-between pl-2 text-slate-800 print:text-black">
              <span>{item.qty} x {new Intl.NumberFormat('id-ID').format(item.price)}</span>
              <span className="font-medium text-black">{new Intl.NumberFormat('id-ID').format(item.qty * item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-black/50 py-2 space-y-1">
        <div className="flex justify-between font-bold" style={{ fontSize: width < 60 ? '12px' : '14px' }}>
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
      <div className="text-center mt-6 space-y-3">
        <div className="border-t border-b border-dashed border-black/50 py-2">
          <p className="font-bold mb-1" style={{ fontSize: '9px' }}>LAYANAN TERSEDIA:</p>
          <p className="text-[8px] leading-snug text-slate-800 print:text-black">
            Tarik Tunai • Transfer Bank • Pulsa<br/>
            Token Listrik • PDAM • BPJS • Topup
          </p>
        </div>
        <div>
          <p className="font-medium mb-1" style={{ fontSize: '10px' }}>Terima Kasih</p>
          <p className="text-[8px] text-slate-500 print:text-black">Simpan struk ini sebagai bukti pembayaran yang sah</p>
        </div>
        <p className="text-[7px] uppercase pt-2 text-slate-300 print:text-black/50">Powered by Buku Saku App</p>
      </div>
    </div>
  );
};
