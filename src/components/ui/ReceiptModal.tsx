import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Share2, CheckCircle2, FileDown, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
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

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { showToast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      // 1. Capture elemen struk menjadi gambar canvas dengan resolusi tinggi
      const canvas = await html2canvas(element, {
        scale: 3, // Scale tinggi agar teks tajam
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // 2. Hitung dimensi PDF agar pas dengan struk (bukan A4)
      // Kita set lebar fix 58mm (standar thermal), tinggi menyesuaikan proporsi gambar
      const pdfWidth = 58; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // 3. Buat PDF dengan ukuran custom (Continuous Paper)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight] // Ukuran dinamis, jadi 1 halaman panjang
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0 print:block print:static print:inset-auto print:h-auto">
        {/* CSS Khusus Print & PDF Generation */}
        <style>{`
          @media print {
            @page {
              margin: 0;
              size: auto; /* Biarkan konten menentukan ukuran */
            }
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            body * {
              visibility: hidden;
            }
            #receipt-content, #receipt-content * {
              visibility: visible;
            }
            #receipt-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 58mm; /* Lebar fix 58mm */
              min-height: auto;
              padding: 0;
              margin: 0;
              font-family: 'Courier New', Courier, monospace;
              font-size: 10px;
              line-height: 1.1;
              color: black;
              background: white;
              /* Properti kunci untuk mencegah potong halaman */
              page-break-inside: avoid; 
              break-inside: avoid;
              page-break-before: avoid;
              page-break-after: avoid;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white text-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:w-auto print:max-w-none print:rounded-none print:overflow-visible"
        >
          {/* Header Actions */}
          <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-100 no-print">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Transaksi Sukses
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Receipt Content Area - Dipadatkan */}
          <div className="p-6 font-mono text-sm leading-relaxed print:p-2 bg-white print:w-[58mm]" id="receipt-content">
            <div className="text-center mb-4 print:mb-2">
              <h2 className="text-2xl font-black uppercase tracking-widest mb-1 print:text-lg">28 POINT</h2>
              <p className="text-[10px] text-slate-500 print:text-[8px]">Store & Management</p>
              
              <div className="mt-3 text-[10px] text-slate-400 flex justify-between border-t border-b border-dashed border-slate-300 py-1.5 print:text-[8px] print:mt-1 print:py-1 print:border-black">
                 <span>NO: {data.id.slice(0, 8).toUpperCase()}</span>
                 <span>{format(new Date(data.date), 'dd/MM/yy HH:mm', { locale: id })}</span>
              </div>
            </div>

            <div className="space-y-2 min-h-[50px] print:space-y-1 print:min-h-0">
              {data.items.map((item, index) => (
                <div key={index} className="flex flex-col border-b border-slate-50 pb-1 last:border-0 last:pb-0 print:border-none print:pb-0">
                  <p className="font-bold truncate text-slate-800 print:text-[9px] print:whitespace-normal leading-tight">{item.name}</p>
                  <div className="flex justify-between text-xs text-slate-500 mt-0.5 print:text-[9px] print:mt-0 print:text-black">
                    <span>{item.qty} x {formatCurrency(item.price)}</span>
                    <span className="font-bold text-slate-900 print:text-black">{formatCurrency(item.qty * item.price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 my-3 print:my-1 print:border-black print:border-dashed" />

            {/* Rincian Pembayaran */}
            <div className="space-y-1 print:space-y-0.5">
              <div className="flex justify-between items-center text-lg font-black text-slate-900 print:text-xs">
                <span>TOTAL</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
              
              {data.payment_amount !== undefined && data.change_amount !== undefined && (
                <>
                  <div className="flex justify-between items-center text-xs text-slate-600 mt-1 print:text-[9px] print:mt-0.5 print:text-black">
                    <span>TUNAI</span>
                    <span>{formatCurrency(data.payment_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600 print:text-[9px] print:text-black">
                    <span>KEMBALI</span>
                    <span className="font-bold">{formatCurrency(data.change_amount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-b border-dashed border-slate-300 my-3 print:my-1 print:border-black" />

            {/* Footer Compact */}
            <div className="text-center space-y-3 mt-4 print:mt-1 print:space-y-1">
              <div className="text-[10px] text-slate-500 print:text-[8px] print:text-black leading-tight">
                <p className="font-bold text-slate-700 print:text-black">TERIMA KASIH</p>
                <p>Barang yang sudah dibeli</p>
                <p>tidak dapat ditukar/dikembalikan.</p>
              </div>

              <div className="border-t border-b border-slate-200 py-2 my-2 print:py-1 print:my-1 print:border-black print:border-dashed">
                <p className="font-bold text-[10px] text-slate-800 mb-1 print:text-[8px] print:text-black">TERSEDIA LAYANAN:</p>
                <p className="text-[9px] text-slate-500 leading-tight print:text-[8px] print:text-black">
                  Tarik & Setor Tunai • Transfer Bank<br/>
                  Pulsa • Paket Data • Token PLN<br/>
                  Bayar PDAM • BPJS • Cicilan • Topup E-Wallet
                </p>
              </div>

              <div className="text-[9px] text-slate-400 uppercase leading-tight px-4 print:px-0 print:text-black print:text-[7px]">
                Jl. Kali Brantas No. 28, RT 003/RW 002<br/>
                Bendo, Kepanjenkidul, Kota Blitar<br/>
                Jawa Timur, 66116
              </div>
            </div>
            
            <div className="hidden print:block text-center text-[7px] text-slate-300 mt-2 uppercase tracking-wider print:text-black print:mt-1">
              Powered by Buku Saku App
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 no-print">
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
