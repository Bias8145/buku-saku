import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Share2, CheckCircle2, FileDown, Loader2, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';

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
  { id: '58mm', width: 58, label: '58mm', desc: 'Printer Mobile / Bluetooth' },
  { id: '80mm', width: 80, label: '80mm', desc: 'Printer Kasir Desktop' },
  { id: '76mm', width: 76, label: '76mm', desc: 'Printer Dot Matrix' },
  { id: '57mm', width: 57, label: '57mm', desc: 'Mesin EDC' },
];

// Komponen Template Struk (Dipakai di Preview & PDF Generator)
const ReceiptTemplate = React.forwardRef<HTMLDivElement, { data: ReceiptData; width: number; className?: string }>(
  ({ data, width, className }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn("bg-white text-slate-900 font-mono text-[10px] leading-tight p-4", className)}
        style={{ width: `${width}mm` }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="font-bold text-base mb-1">28 POINT</h1>
          <p className="text-[9px] leading-tight px-2 break-words">
            Jl. Kali Brantas No. 28, RT 003/RW 002, BENDO, KEPANJENKIDUL, KOTA BLITAR, JAWA TIMUR, ID, 66116
          </p>
        </div>

        <div className="border-b border-dashed border-slate-300 my-2" />
        
        <div className="flex justify-between text-[9px] text-slate-500 mb-2">
          <span>{format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
          <span>#{data.id.slice(0, 6).toUpperCase()}</span>
        </div>
        
        <div className="border-b border-dashed border-slate-300 my-2" />

        {/* Items */}
        <div className="space-y-3 mb-4">
          {data.items.map((item, i) => (
            <div key={i}>
              <div className="font-bold mb-0.5 uppercase break-words">{item.name}</div>
              <div className="flex justify-between pl-0">
                <span className="text-slate-600">{item.qty} x {new Intl.NumberFormat('id-ID').format(item.price)}</span>
                <span className="font-bold">{new Intl.NumberFormat('id-ID').format(item.qty * item.price)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-slate-300 py-2 space-y-1">
          <div className="flex justify-between font-bold text-xs">
            <span>TOTAL</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
          {data.payment_amount !== undefined && (
            <>
              <div className="flex justify-between pt-1 text-slate-600">
                <span>TUNAI</span>
                <span>{formatCurrency(data.payment_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>KEMBALI</span>
                <span>{formatCurrency(data.change_amount || 0)}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <div className="border-y border-dashed border-slate-200 py-2 bg-slate-50 -mx-4 px-4">
            <p className="font-bold text-[9px] mb-1">LAYANAN TERSEDIA:</p>
            <p className="text-[9px] leading-snug text-slate-500">
              Tarik Tunai • Transfer Bank • Pulsa<br/>
              Token Listrik • PDAM • BPJS • Topup
            </p>
          </div>
          <div className="pt-2">
            <p className="font-bold">Terima Kasih</p>
          </div>
        </div>
      </div>
    );
  }
);

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [paperWidth, setPaperWidth] = useState(58);
  const [showSettings, setShowSettings] = useState(false);
  
  // Ref untuk elemen visual di layar (Preview)
  const previewRef = useRef<HTMLDivElement>(null);
  // Ref untuk elemen hidden PDF generator
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  // --- TEKNIK PRINT IFRAME ISOLATION ---
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Generate HTML Struk
    const content = `
      <html>
        <head>
          <title>Struk Belanja</title>
          <style>
            @page { margin: 0; size: auto; }
            html, body { 
              margin: 0; 
              padding: 0; 
              font-family: 'Courier New', Courier, monospace; 
              width: ${paperWidth}mm;
              background-color: #fff;
            }
            .receipt { width: 100%; padding: 0 0 10px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 10px; }
            .text-xs { font-size: 9px; }
            .address { font-size: 9px; line-height: 1.2; padding: 0 2px; word-wrap: break-word; margin-bottom: 5px; }
            .border-dashed { border-bottom: 1px dashed #000; margin: 5px 0; }
            .flex { display: flex; justify-content: space-between; }
            .mb-1 { margin-bottom: 2px; }
            .item-row { margin-bottom: 6px; }
            .item-name { text-transform: uppercase; font-weight: bold; margin-bottom: 2px; word-wrap: break-word; }
            .item-detail { display: flex; justify-content: space-between; font-size: 9px; }
            .footer-note { font-size: 8px; margin-top: 5px; color: #000; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="text-center">
              <div class="font-bold" style="font-size: 16px; margin-bottom: 4px;">28 POINT</div>
              <div class="address">
                Jl. Kali Brantas No. 28, RT 003/RW 002, BENDO, KEPANJENKIDUL, KOTA BLITAR, JAWA TIMUR, ID, 66116
              </div>
            </div>
            
            <div class="border-dashed"></div>
            
            <div class="flex text-xs" style="margin-bottom: 2px;">
              <span>${format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
              <span>#${data.id.slice(0, 6).toUpperCase()}</span>
            </div>
            
            <div class="border-dashed"></div>
            
            <div class="items" style="margin-top: 5px; margin-bottom: 5px;">
              ${data.items.map(item => `
                <div class="item-row text-sm">
                  <div class="item-name">${item.name}</div>
                  <div class="item-detail">
                    <span>${item.qty} x ${new Intl.NumberFormat('id-ID').format(item.price)}</span>
                    <span class="font-bold">${new Intl.NumberFormat('id-ID').format(item.qty * item.price)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="border-dashed"></div>
            
            <div class="text-sm" style="margin-top: 5px;">
              <div class="flex font-bold" style="font-size: 12px; margin-bottom: 4px;">
                <span>TOTAL</span>
                <span>${formatCurrency(data.total)}</span>
              </div>
              ${data.payment_amount !== undefined ? `
                <div class="flex">
                  <span>TUNAI</span>
                  <span>${formatCurrency(data.payment_amount)}</span>
                </div>
                <div class="flex">
                  <span>KEMBALI</span>
                  <span>${formatCurrency(data.change_amount || 0)}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="border-dashed"></div>
            
            <div class="text-center text-xs" style="margin-top: 10px;">
              <div class="font-bold" style="margin-bottom: 2px;">LAYANAN TERSEDIA:</div>
              <div style="font-size: 9px; margin-bottom: 8px; line-height: 1.3;">
                Tarik Tunai • Transfer Bank • Pulsa<br/>
                Token Listrik • PDAM • BPJS • Topup
              </div>
              <div class="font-bold">Terima Kasih</div>
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(content);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const handleSavePdf = async () => {
    if (!pdfTemplateRef.current) return;
    setIsGeneratingPdf(true);
    
    try {
      // Capture elemen hidden yang bersih (tanpa zigzag/shadow)
      const element = pdfTemplateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Scale 2 cukup tajam dan ukuran file wajar
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG kompresi 0.8
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
      console.error("PDF Error:", error);
      showToast("Gagal membuat PDF", "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateReceiptText = () => {
    const dateStr = format(new Date(data.date), 'dd/MM/yyyy HH:mm', { locale: id });
    const line = "-".repeat(32);
    let text = `28 POINT\nJl. Kali Brantas No. 28, Blitar\n${line}\n`;
    text += `Tgl : ${dateStr}\nNo  : ${data.id.slice(0, 8).toUpperCase()}\n${line}\n`;
    data.items.forEach(item => {
      text += `${item.name.toUpperCase()}\n${item.qty} x ${formatCurrency(item.price)} = ${formatCurrency(item.qty * item.price)}\n`;
    });
    text += `${line}\nTOTAL   : ${formatCurrency(data.total)}\n`;
    if (data.payment_amount) {
      text += `TUNAI   : ${formatCurrency(data.payment_amount)}\nKEMBALI : ${formatCurrency(data.change_amount || 0)}\n`;
    }
    text += `${line}\nTerima Kasih\n`;
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
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-100 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-slate-200 shrink-0 z-20">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Transaksi Berhasil</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Siap dicetak</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold ${showSettings ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  <Settings2 size={16} />
                  <span>Kertas</span>
                  {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="bg-white border-b border-slate-200 overflow-hidden shrink-0 z-10"
                >
                  <div className="p-4 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pilih Ukuran Kertas</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PAPER_SIZES.map(size => (
                        <button
                          key={size.id}
                          onClick={() => setPaperWidth(size.width)}
                          className={cn(
                            "flex flex-col items-start p-3 rounded-xl border transition-all text-left relative h-full",
                            paperWidth === size.width 
                              ? "bg-white border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500" 
                              : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          )}
                        >
                          <div className="flex justify-between w-full mb-1">
                            <span className={cn(
                              "text-sm font-bold",
                              paperWidth === size.width ? "text-blue-600" : "text-slate-700"
                            )}>
                              {size.label}
                            </span>
                            {paperWidth === size.width && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight font-medium w-full break-words">
                            {size.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#d1d5db] relative flex justify-center items-start shadow-inner">
              <div 
                ref={previewRef}
                className="bg-white shadow-2xl relative transition-all duration-300 shrink-0 text-slate-900"
                style={{ 
                  width: `${paperWidth}mm`, 
                  minHeight: '200px',
                }}
              >
                {/* Zigzag Top */}
                <div 
                  className="absolute -top-2 left-0 w-full h-4 bg-white"
                  style={{
                     maskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
                     maskSize: '10px 10px',
                     maskRepeat: 'repeat-x',
                     WebkitMaskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
                     WebkitMaskSize: '10px 10px',
                     WebkitMaskRepeat: 'repeat-x',
                     transform: 'rotate(180deg)'
                  }}
                />

                {/* Konten Struk Visual */}
                <ReceiptTemplate data={data} width={paperWidth} className="pt-6 pb-6" />

                {/* Zigzag Bottom */}
                <div 
                  className="absolute -bottom-2 left-0 w-full h-4 bg-white"
                  style={{
                     maskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
                     maskSize: '10px 10px',
                     maskRepeat: 'repeat-x',
                     WebkitMaskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
                     WebkitMaskSize: '10px 10px',
                     WebkitMaskRepeat: 'repeat-x'
                  }}
                />
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
      </AnimatePresence>

      {/* Hidden Render for PDF Generation */}
      {createPortal(
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <ReceiptTemplate ref={pdfTemplateRef} data={data} width={paperWidth} />
        </div>,
        document.body
      )}
    </>
  );
};
