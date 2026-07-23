import React, { useState, useEffect } from 'react';
import { LifeBuoy, Search, Filter, AlertCircle, CheckCircle2, Clock, Check, RefreshCw, User, Layout, ArrowUpRight } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';
import Skeleton from '../../../components/ui/Skeleton';

export default function SupportDesk() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [statusUpdating, setStatusUpdating] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/support/tickets');
      if (res.data && res.data.success) {
        setTickets(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    setStatusUpdating(ticketId);
    try {
      const res = await axiosClient.patch(`/support/tickets/${ticketId}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        setTickets(prev =>
          prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      (ticket.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.portal_used || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || ticket.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || ticket.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const urgentCount = tickets.filter(t => t.priority === 'Urgent').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const categoriesList = ['All', ...new Set(tickets.map(t => t.category))];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-6 md:p-8 text-white border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-white uppercase">Super Admin Support Desk</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium max-w-xl">
            Centralized support ticket repository. Manage and resolve issues raised across all clinic portals, workstations, and user accounts.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-white/10 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Desk
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Tickets</span>
          <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="block text-[10px] text-blue-500 font-black uppercase tracking-widest">Open Requests</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{openCount}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="block text-[10px] text-rose-500 font-black uppercase tracking-widest">Urgent Priority</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{urgentCount}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="block text-[10px] text-emerald-500 font-black uppercase tracking-widest">Resolved / Closed</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tickets by user, portal, subject..."
            className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-[#f8f9fa] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-[#f8f9fa] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">No Support Tickets Found</h4>
          <p className="text-xs text-slate-400">No tickets match your search or filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => {
            const priorityColors = {
              Low: 'bg-slate-100 text-slate-700 border-slate-200',
              Medium: 'bg-blue-50 text-blue-700 border-blue-200',
              High: 'bg-amber-50 text-amber-700 border-amber-200',
              Urgent: 'bg-rose-50 text-rose-700 border-rose-200'
            };

            const statusColors = {
              'Open': 'bg-blue-500 text-white',
              'In Progress': 'bg-amber-500 text-white',
              'Resolved': 'bg-emerald-500 text-white',
              'Closed': 'bg-slate-500 text-white'
            };

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${priorityColors[ticket.priority] || priorityColors.Medium}`}>
                      {ticket.priority} Priority
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold border border-slate-200">
                      {ticket.category}
                    </span>
                    <span className="px-2.5 py-0.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1">
                      <Layout className="w-3 h-3" />
                      {ticket.portal_used}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(ticket.created_at).toLocaleString()}
                    </span>
                    <div className="h-4 w-px bg-slate-200"></div>
                    {/* Status Select */}
                    <select
                      value={ticket.status}
                      disabled={statusUpdating === ticket.id}
                      onChange={e => handleStatusChange(ticket.id, e.target.value)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border-none cursor-pointer ${statusColors[ticket.status] || 'bg-slate-700 text-white'}`}
                    >
                      <option value="Open" className="bg-white text-slate-800">Open</option>
                      <option value="In Progress" className="bg-white text-slate-800">In Progress</option>
                      <option value="Resolved" className="bg-white text-slate-800">Resolved</option>
                      <option value="Closed" className="bg-white text-slate-800">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">{ticket.subject}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 text-[11px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{ticket.user_name || 'Anonymous User'}</span>
                    {ticket.user_role && <span className="text-[10px] text-slate-400">({ticket.user_role})</span>}
                  </div>
                  {ticket.user_email && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400">{ticket.user_email}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
