import React, { useState } from 'react';
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
  { label: '58mm (Struk Kecil/Mobile)', width: 58, type: 'roll' },
  { label: '80mm (Struk Besar/Desktop)', width: 80, type: 'roll' },
  { label: '76mm (Dot Matrix)', width: 76, type: 'roll' },
  { label: '57mm (EDC/Mini)', width: 57, type: 'roll' },
  { label: '100mm (Label/Resi)', width: 100, type: 'label' },
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [paperWidth, setPaperWidth] = useState(58); // Default 58mm
  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      // 1. Capture elemen struk dengan setting optimal
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Paksa ukuran canvas sesuai konten agar tidak ada whitespace
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (documentClone) => {
          // Fix styling saat cloning untuk PDF
          const el = documentClone.getElementById('receipt-content');
          if (el) {
            el.style.transform = 'none';
            el.style.position = 'static';
            el.style.margin = '0';
            // Pastikan width saat capture sesuai setting
            el.style.width = `${paperWidth}mm`;
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Hitung rasio aspek untuk PDF panjang (seperti struk asli)
      const pdfWidth = paperWidth; // mm (Dynamic based on selection)
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight], // Ukuran kertas dinamis sesuai panjang struk
        compress: true 
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Struk-28POINT-${data.id.slice(0, 8)}.pdf`);
      
      showToast("PDF berhasil disimpan!", "success");
    } catch (error) {
      console.error("PDF Error:", error);
      showToast("Gagal membuat PDF", "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateReceiptText = () => {
    const dateStr = format(new Date(data.date), 'dd/MM/yyyy HH:mm', { locale: id });
    let text = `*28 POINT*\n`;
    text += `Store & Management\n`;
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
    text += `Barang tidak dapat ditukar.\n\n`;
    
    text += `--------------------------------\n`;
    text += `TERSEDIA LAYANAN:\n`;
    text += `✅ Tarik & Setor Tunai\n`;
    text += `✅ Transfer Bank (Semua Bank)\n`;
    text += `✅ Pulsa, Paket Data, Token PLN\n`;
    text += `✅ Bayar PDAM, BPJS, Cicilan, dll\n`;
    text += `--------------------------------\n\n`;
    
    text += `Jl. Kali Brantas No. 28, RT 003/RW 002\n`;
    text += `Bendo, Kepanjenkidul, Kota Blitar\n`;
    text += `Jawa Timur, 66116\n`;
    
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
        showToast("Teks struk disalin!", "success");
      } catch (err) {
        showToast("Gagal menyalin", "error");
      }
    }
  };

  return (
    <AnimatePresence>
      {/* Wrapper Modal Utama */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print-container">
        {/* CSS Khusus Print Dinamis */}
        <style>{`
          @media print {
            @page {
              margin: 0;
              size: auto;
            }
            
            /* Reset root elements */
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            /* Sembunyikan semua elemen halaman */
            body * {
              visibility: hidden;
            }

            /* Reset container modal agar tidak mempengaruhi layout print */
            .print-container {
              position: static !important;
              display: block !important;
              background: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: auto !important;
              height: auto !important;
            }

            /* Reset kartu modal (hilangkan transform dan centering) */
            .print-card {
              position: static !important;
              transform: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: auto !important;
              max-width: none !important;
              border-radius: 0 !important;
            }

            /* Tampilkan HANYA konten struk */
            #receipt-content, #receipt-content * {
              visibility: visible;
            }

            /* Posisikan struk di pojok kiri atas kertas */
            #receipt-content {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: ${paperWidth}mm !important; /* Lebar Dinamis */
              margin: 0 !important;
              padding: 0 !important;
              
              /* Styling teks print */
              font-family: 'Arial', sans-serif !important; 
              font-size: 10px !important;
              line-height: 1.3 !important;
              color: black !important;
              background: white !important;
            }

            /* Sembunyikan elemen non-print */
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white text-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl print-card flex flex-col max-h-[90vh]"
        >
          {/* Header Actions */}
          <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-100 no-print shrink-0">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Transaksi Sukses
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  showSettings ? "bg-blue-100 text-blue-600" : "hover:bg-slate-200 text-slate-500"
                )}
                title="Pengaturan Kertas"
              >
                <Settings2 size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Paper Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-100 border-b border-slate-200 overflow-hidden no-print shrink-0"
              >
                <div className="p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Ukuran Kertas</p>
                  <div className="grid grid-cols-1 gap-2">
                    {PAPER_SIZES.map((size) => (
                      <button
                        key={size.width}
                        onClick={() => {
                          setPaperWidth(size.width);
                          // setShowSettings(false); // Opsional: tutup setelah pilih
                        }}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                          paperWidth === size.width
                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        )}
                      >
                        <span>{size.label}</span>
                        {paperWidth === size.width && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Receipt Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 flex justify-center">
            <div 
              className="bg-white shadow-sm transition-all duration-300 origin-top" 
              id="receipt-content"
              style={{ 
                width: `${paperWidth}mm`,
                minHeight: '100px',
                padding: '15px' // Padding visual di layar
              }}
            >
              <div className="font-sans text-sm leading-relaxed text-black">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-black uppercase tracking-widest mb-1">28 POINT</h2>
                  <p className="text-[10px] text-slate-500">Store & Management</p>
                  
                  <div className="mt-3 text-[10px] text-slate-400 flex justify-between border-t border-b border-dashed border-slate-300 py-2" style={{ borderColor: 'black' }}>
                     <span>NO: {data.id.slice(0, 8).toUpperCase()}</span>
                     <span>{format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
                  </div>
                </div>

                {/* Item List */}
                <div className="space-y-3 min-h-[50px]">
                  {data.items.map((item, index) => (
                    <div key={index} className="flex flex-col border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <p className="font-bold text-slate-800 leading-snug mb-1">{item.name}</p>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{item.qty} x {formatCurrency(item.price)}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(item.qty * item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 my-4" style={{ borderColor: 'black', borderStyle: 'dashed' }} />

                {/* Rincian Pembayaran */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-lg font-black text-slate-900">
                    <span>TOTAL</span>
                    <span>{formatCurrency(data.total)}</span>
                  </div>
                  
                  {data.payment_amount !== undefined && data.change_amount !== undefined && (
                    <>
                      <div className="flex justify-between items-center text-xs text-slate-600 mt-1">
                        <span>TUNAI</span>
                        <span>{formatCurrency(data.payment_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600">
                        <span>KEMBALI</span>
                        <span className="font-bold">{formatCurrency(data.change_amount)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-b border-dashed border-slate-300 my-4" style={{ borderColor: 'black' }} />

                {/* Footer */}
                <div className="text-center space-y-3 mt-4">
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <p className="font-bold text-slate-700 mb-1">TERIMA KASIH</p>
                    <p>Barang yang sudah dibeli</p>
                    <p>tidak dapat ditukar/dikembalikan.</p>
                  </div>

                  <div className="border-t border-b border-slate-200 py-2 my-2" style={{ borderColor: 'black', borderStyle: 'dashed' }}>
                    <p className="font-bold text-[10px] text-slate-800 mb-1">TERSEDIA LAYANAN:</p>
                    <p className="text-[9px] text-slate-500 leading-tight">
                      Tarik & Setor Tunai • Transfer Bank<br/>
                      Pulsa • Paket Data • Token PLN<br/>
                      Bayar PDAM • BPJS • Cicilan • Topup E-Wallet
                    </p>
                  </div>

                  <div className="text-[9px] text-slate-400 uppercase leading-tight px-4">
                    Jl. Kali Brantas No. 28, RT 003/RW 002<br/>
                    Bendo, Kepanjenkidul, Kota Blitar<br/>
                    Jawa Timur, 66116
                  </div>
                </div>
                
                <div className="text-center text-[7px] text-slate-300 mt-2 uppercase tracking-wider no-print">
                  Powered by Buku Saku App
                </div>
                 <div className="hidden print:block text-center text-[7px] text-black mt-2 uppercase tracking-wider">
                  Powered by Buku Saku App
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 no-print shrink-0">
            <Button variant="secondary" className="flex-1 text-xs" onClick={handlePrint}>
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <Button variant="secondary" className="flex-1 text-xs" onClick={handleSavePdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? <Loader2 size={16} className="mr-2 animate-spin" /> : <FileDown size={16} className="mr-2" />}
              PDF
            </Button>
            <Button variant="secondary" className="flex-1 text-xs" onClick={handleShare}>
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
