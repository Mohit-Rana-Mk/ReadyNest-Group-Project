import React from 'react';
import { DollarSign, Package, AlertTriangle, Clock, TrendingUp, ChevronRight } from 'lucide-react';

export function MedicineDashboard({ reports, setActiveTab }) {
  if (!reports) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  const { sales, inventoryValue, lowStock = [], expiryAlerts = [], topSelling = [], salesTrends = [] } = reports;

  const cards = [
    {
      title: "Today's Revenue",
      value: `₹${parseFloat(sales?.today_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      subtitle: "Completed walk-in & online payments",
      icon: DollarSign,
      color: "bg-emerald-500 text-white shadow-emerald-200",
      bgLight: "bg-emerald-50"
    },
    {
      title: "Inventory Stock Value",
      value: `₹${parseFloat(inventoryValue?.total_stock_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      subtitle: `${inventoryValue?.total_medicines || 0} unique medicine items`,
      icon: Package,
      color: "bg-indigo-500 text-white shadow-indigo-200",
      bgLight: "bg-indigo-50"
    },
    {
      title: "Low Stock Items",
      value: lowStock.length,
      subtitle: "Items below minimum alert levels",
      icon: AlertTriangle,
      color: lowStock.length > 0 ? "bg-amber-500 text-white shadow-amber-200 animate-pulse" : "bg-slate-400 text-white",
      bgLight: "bg-amber-50"
    },
    {
      title: "Expiring in 30 Days",
      value: expiryAlerts.length,
      subtitle: "Near-expiry batches requiring attention",
      icon: Clock,
      color: expiryAlerts.length > 0 ? "bg-rose-500 text-white shadow-rose-200" : "bg-slate-400 text-white",
      bgLight: "bg-rose-50"
    }
  ];

  // Render responsive CSS bar chart for sales trends
  const maxRevenue = salesTrends.length > 0 ? Math.max(...salesTrends.map(t => parseFloat(t.revenue) || 1)) : 1;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition duration-300 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">{c.title}</span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{c.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${c.color}`}>
                <c.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              {c.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid: Trends & Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sales Trend Bar Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Sales & Revenue Trend</h3>
              <p className="text-xs text-slate-400 font-medium">Daily billing performance for the past 7 days</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl font-bold">
              <TrendingUp className="w-4 h-4" />
              7-Day Activity
            </span>
          </div>

          {salesTrends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <TrendingUp className="w-10 h-10 stroke-slate-300 mb-2" />
              <p className="text-xs font-semibold">No sales transactions logged in the past week</p>
            </div>
          ) : (
            <div className="flex items-end justify-between h-64 px-4 pt-6 border-b border-slate-100">
              {salesTrends.map((t, index) => {
                const heightPercent = `${Math.max(5, (parseFloat(t.revenue) / maxRevenue) * 85)}%`;
                // Format date to local readable format
                const dateObj = new Date(t.date);
                const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                return (
                  <div key={index} className="flex flex-col items-center group w-full max-w-[50px] mx-2">
                    <div className="relative w-full flex justify-center">
                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-md">
                        ₹{parseFloat(t.revenue).toLocaleString('en-IN')}
                      </div>
                      {/* Bar */}
                      <div 
                        style={{ height: heightPercent }} 
                        className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl group-hover:from-indigo-600 group-hover:to-indigo-500 transition-all duration-300 shadow-[0_2px_10px_rgba(99,102,241,0.15)]"
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 mt-2">{dayLabel}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{dayDate}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-4 bg-white border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] rounded-3xl p-6">
          <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Top Fast-Moving Medicines</h3>
          <div className="space-y-4">
            {topSelling.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold py-8 text-center">No sales data available yet</p>
            ) : (
              topSelling.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700">{item.medicine_name}</h4>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase">{item.quantity_sold} units sold</p>
                  </div>
                  <span className="text-xs font-black text-emerald-600">₹{parseFloat(item.total_revenue).toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Alerts & Critical Stock Warning Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Low Stock Warnings
            </h3>
            <button 
              onClick={() => setActiveTab('inventory')}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
            >
              Manage Inventory <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {lowStock.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-8 text-center">All medicines have sufficient stock levels</p>
            ) : (
              lowStock.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center group">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700">{item.medicine_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{item.brand}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl">
                      {item.available_quantity} left
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Alert Level: {item.min_stock_alert}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Near Expiry Alerts */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Near Expiry Alerts
            </h3>
            <button 
              onClick={() => setActiveTab('inventory')}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
            >
              Audit Batches <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {expiryAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-8 text-center">No batches expiring in the next 30 days</p>
            ) : (
              expiryAlerts.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700">{item.medicine_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Batch: {item.batch_number}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl inline-block">
                      Expires: {new Date(item.expiry_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">{item.available_quantity} units affected</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
