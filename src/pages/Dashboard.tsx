import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { supabase, Transaction } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { SEO } from '../components/SEO';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    capital: 0,
    profit: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ dates: string[], income: number[], expense: number[] }>({ dates: [], income: [], expense: [] });
  const { theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: txs, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      if (txs) {
        const income = txs
          .filter(t => t.type === 'income' && t.category !== 'capital')
          .reduce((acc, curr) => acc + Number(curr.amount), 0);

        const expense = txs
          .filter(t => t.type === 'expense')
          .reduce((acc, curr) => acc + Number(curr.amount), 0);
          
        const capital = txs
          .filter(t => t.category === 'capital')
          .reduce((acc, curr) => acc + Number(curr.amount), 0);

        setStats({
          income,
          expense,
          capital,
          profit: income - expense,
        });

        setTransactions(txs.slice().reverse().slice(0, 5));

        const groupedData = txs.reduce((acc, curr) => {
          const date = format(parseISO(curr.date), 'dd MMM', { locale: id });
          if (!acc[date]) acc[date] = { income: 0, expense: 0 };
          
          if (curr.type === 'income' && curr.category !== 'capital') {
            acc[date].income += Number(curr.amount);
          } else if (curr.type === 'expense') {
            acc[date].expense += Number(curr.amount);
          }
          return acc;
        }, {} as Record<string, { income: number; expense: number }>);

        const dates = Object.keys(groupedData);
        const incomeData = dates.map(d => groupedData[d].income);
        const expenseData = dates.map(d => groupedData[d].expense);

        setChartData({ dates, income: incomeData, expense: expenseData });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = () => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
        padding: [10, 15],
        borderRadius: 12,
        formatter: function(params: any) {
          let result = `<div style="font-weight:600; margin-bottom:4px">${params[0].name}</div>`;
          params.forEach((param: any) => {
            const color = param.seriesName === 'Pemasukan' ? '#3b82f6' : '#f43f5e';
            result += `<div style="display:flex; align-items:center; gap:8px; font-size:12px">
              <span style="width:8px; height:8px; border-radius:50%; background:${color}"></span>
              <span style="color:${isDark ? '#cbd5e1' : '#64748b'}">${param.seriesName}</span>
              <span style="font-weight:600; margin-left:auto">${new Intl.NumberFormat('id-ID').format(param.value)}</span>
            </div>`;
          });
          return result;
        }
      },
      legend: {
        data: ['Pemasukan', 'Pengeluaran'],
        bottom: 0,
        icon: 'circle',
        itemGap: 24,
        textStyle: { color: textColor, fontSize: 12 }
      },
      grid: {
        left: '0%',
        right: '0%',
        bottom: '12%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.dates,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textColor, fontSize: 11, margin: 12 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: gridColor } },
        axisLabel: { 
          color: textColor, 
          fontSize: 11,
          formatter: (value: number) => value >= 1000000 ? `${value/1000000}jt` : value >= 1000 ? `${value/1000}rb` : value 
        }
      },
      series: [
        {
          name: 'Pemasukan',
          type: 'bar',
          data: chartData.income,
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 4, 4] },
          barMaxWidth: 12,
          emphasis: { itemStyle: { color: '#2563eb' } }
        },
        {
          name: 'Pengeluaran',
          type: 'bar',
          data: chartData.expense,
          itemStyle: { color: '#f43f5e', borderRadius: [4, 4, 4, 4] },
          barMaxWidth: 12,
          emphasis: { itemStyle: { color: '#e11d48' } }
        }
      ]
    };
  };

  const StatCard = ({ title, amount, icon: Icon, color, bg, darkBg, darkColor }: any) => (
    <Card className="flex flex-col gap-3 relative overflow-hidden group hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 border-none ring-1 ring-slate-100 dark:ring-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {loading ? '...' : formatCurrency(amount)}
          </h3>
        </div>
        <div className={`p-2.5 rounded-xl transition-colors ${bg} ${color} dark:${darkBg} dark:${darkColor}`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SEO title="Dashboard" />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Ringkasan performa toko Anda hari ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Laba"
          amount={stats.profit}
          icon={PiggyBank}
          color="text-emerald-600"
          bg="bg-emerald-50"
          darkBg="bg-emerald-900/20"
          darkColor="text-emerald-400"
        />
        <StatCard
          title="Pemasukan"
          amount={stats.income}
          icon={TrendingUp}
          color="text-blue-600"
          bg="bg-blue-50"
          darkBg="bg-blue-900/20"
          darkColor="text-blue-400"
        />
        <StatCard
          title="Pengeluaran"
          amount={stats.expense}
          icon={TrendingDown}
          color="text-rose-600"
          bg="bg-rose-50"
          darkBg="bg-rose-900/20"
          darkColor="text-rose-400"
        />
        <StatCard
          title="Modal Aktif"
          amount={stats.capital}
          icon={Wallet}
          color="text-violet-600"
          bg="bg-violet-50"
          darkBg="bg-violet-900/20"
          darkColor="text-violet-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-2 p-6 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Analitik Keuangan</h3>
            <select className="text-xs bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-slate-500 outline-none cursor-pointer">
              <option>Bulan Ini</option>
            </select>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Memuat data...</div>
          ) : chartData.dates.length > 0 ? (
            <ReactECharts option={getChartOption()} style={{ height: '300px', width: '100%' }} theme={theme === 'dark' ? 'dark' : undefined} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              Belum ada data transaksi
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="p-0 overflow-hidden flex flex-col h-[380px]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#111827]">
             <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Aktivitas Baru</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30'}`}>
                      {t.type === 'income' ? <ArrowUpRight size={16} strokeWidth={2} /> : <ArrowDownLeft size={16} strokeWidth={2} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate max-w-[100px]">{t.description || t.category}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{format(parseISO(t.date), 'dd MMM', { locale: id })}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <Receipt size={18} className="text-slate-300" />
                </div>
                <span className="text-xs">Belum ada transaksi</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
