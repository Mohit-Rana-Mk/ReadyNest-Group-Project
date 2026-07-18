import React, { useState } from 'react';
import { Search, Plus, Edit, Trash, AlertTriangle, AlertCircle, Calendar, Package, DollarSign, X } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';
import { toast } from '../../../components/ui/Toast';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

export function InventoryManagement({ inventory, refreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [medToDelete, setMedToDelete] = useState(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    medicine_name: '',
    generic_name: '',
    brand: '',
    batch_number: '',
    expiry_date: '',
    purchase_price: '',
    selling_price: '',
    available_quantity: '',
    min_stock_alert: 10,
    supplier_details: '',
    gst_percent: 0,
    barcode: ''
  });

  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedMed(null);
    setFormData({
      medicine_name: '',
      generic_name: '',
      brand: '',
      batch_number: '',
      expiry_date: '',
      purchase_price: '',
      selling_price: '',
      available_quantity: '',
      min_stock_alert: 10,
      supplier_details: '',
      gst_percent: 0,
      barcode: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditMode(true);
    setSelectedMed(med);
    
    // Format date string for HTML date input
    const expDate = new Date(med.expiry_date);
    const formattedDate = expDate.toISOString().split('T')[0];

    setFormData({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name,
      brand: med.brand,
      batch_number: med.batch_number,
      expiry_date: formattedDate,
      purchase_price: med.purchase_price,
      selling_price: med.selling_price,
      available_quantity: med.available_quantity,
      min_stock_alert: med.min_stock_alert,
      supplier_details: med.supplier_details || '',
      gst_percent: med.gst_percent || 0,
      barcode: med.barcode || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (med) => {
    setMedToDelete(med);
  };

  const confirmDelete = async () => {
    if (!medToDelete) return;
    try {
      await axiosClient.delete(`/medicine/stock/${medToDelete.id}`);
      toast.success("Medicine removed successfully.");
      if (refreshData) refreshData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete medicine.");
    } finally {
      setMedToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axiosClient.put(`/medicine/stock/${selectedMed.id}`, formData);
        toast.success("Medicine updated successfully.");
      } else {
        await axiosClient.post('/medicine/stock', formData);
        toast.success("Medicine added to inventory successfully.");
      }
      setIsModalOpen(false);
      if (refreshData) refreshData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save medicine.");
    }
  };

  const filteredInventory = inventory.filter(m => 
    m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Pharmacy Stock Ledger</h3>
          <p className="text-xs text-slate-400 font-medium">Add, update, or remove medicines, set prices, and monitor stock health levels</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 stroke-slate-400" />
            <input
              type="text"
              placeholder="Search by name, generic, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border-0 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-sm hover:shadow-[0_2px_10px_rgba(99,102,241,0.2)] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Stock Grid/Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
        {filteredInventory.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            No medicine records found in stock ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="pb-3">Medicine Info</th>
                  <th className="pb-3 text-center">Batch No.</th>
                  <th className="pb-3 text-center">Expiry</th>
                  <th className="pb-3 text-center">Cost Price</th>
                  <th className="pb-3 text-center">Retail Price</th>
                  <th className="pb-3 text-center">Available Stock</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredInventory.map((item) => {
                  const isLow = item.available_quantity <= item.min_stock_alert;
                  
                  // Expiry checks
                  const expDate = new Date(item.expiry_date);
                  const today = new Date();
                  const diffTime = expDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpired = diffDays <= 0;
                  const isExpiringSoon = diffDays > 0 && diffDays <= 30;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4">
                        <div className="font-bold text-slate-800">{item.medicine_name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Gen: {item.generic_name} • Brand: {item.brand}</div>
                        {item.barcode && <div className="text-[9px] text-slate-400 mt-0.5">Barcode: {item.barcode}</div>}
                      </td>
                      <td className="py-4 text-center text-slate-500 font-mono">{item.batch_number}</td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            isExpired ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            isExpiringSoon ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {expDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                          {isExpired && <span className="text-[8px] font-extrabold text-rose-500 mt-1 uppercase">Expired</span>}
                          {isExpiringSoon && <span className="text-[8px] font-extrabold text-amber-500 mt-1 uppercase">{diffDays} Days left</span>}
                        </div>
                      </td>
                      <td className="py-4 text-center text-slate-500">₹{parseFloat(item.purchase_price).toFixed(2)}</td>
                      <td className="py-4 text-center text-slate-800 font-bold">₹{parseFloat(item.selling_price).toFixed(2)}</td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                            isLow ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {item.available_quantity} units
                          </span>
                          {isLow && (
                            <span className="text-[8px] font-bold text-amber-500 mt-1 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Reorder limit: {item.min_stock_alert}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 transition"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 transition"
                          >
                            <Trash className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 mx-4 overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <Package className="w-5 h-5 text-indigo-500" />
                {editMode ? 'Modify Stock Record' : 'Upload New Therapeutic'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Medicine Name</label>
                  <input
                    required
                    type="text"
                    value={formData.medicine_name}
                    onChange={e => setFormData({ ...formData, medicine_name: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                    placeholder="e.g. Crocin Advance"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Brand/Manufacturer</label>
                  <input
                    required
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                    placeholder="e.g. GlaxoSmithKline"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Generic Name</label>
                <input
                  required
                  type="text"
                  value={formData.generic_name}
                  onChange={e => setFormData({ ...formData, generic_name: e.target.value })}
                  className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  placeholder="e.g. Paracetamol"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Batch Number</label>
                  <input
                    required
                    type="text"
                    value={formData.batch_number}
                    onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                    placeholder="e.g. BAT-2026-X"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Expiry Date</label>
                  <input
                    required
                    type="date"
                    value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Cost Price (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Selling Price (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">GST Tax (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.gst_percent}
                    onChange={e => setFormData({ ...formData, gst_percent: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Upload Stock Quantity</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.available_quantity}
                    onChange={e => setFormData({ ...formData, available_quantity: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Min Stock Alert Level</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.min_stock_alert}
                    onChange={e => setFormData({ ...formData, min_stock_alert: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Barcode / Code128</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                    placeholder="e.g. 8901234567890"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Supplier Details</label>
                  <input
                    type="text"
                    value={formData.supplier_details}
                    onChange={e => setFormData({ ...formData, supplier_details: e.target.value })}
                    className="w-full bg-[#f8f9fa] border-0 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                    placeholder="e.g. MedVantage Distribs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {editMode ? 'Save Details' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal for Medicine Deletion */}
      <ConfirmModal
        isOpen={!!medToDelete}
        onClose={() => setMedToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Medicine?"
        message={`Are you sure you want to permanently delete ${medToDelete?.medicine_name} from inventory?`}
        confirmText="Yes, Delete"
        isDestructive={true}
      />
    </div>
  );
}
