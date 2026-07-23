import { toast } from '../../../components/ui/Toast';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { CustomDropdown } from '../../../components/ui/CustomDropdown';
import { Heart, Activity, Eye, Bone, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

const iconMap = {
  'Cardiology': Heart,
  'General Medicine': Activity,
  'Ophthalmology': Eye,
  'Orthopedics': Bone
};

export function DepartmentManager({ departments, refreshData, clinicId = 1 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [globalServices, setGlobalServices] = useState([]);
  const [formData, setFormData] = useState({ service_id: '', custom_service_name: '', consultation_fee: '' });

  useEffect(() => {
    // Fetch global services for the Add Department dropdown
    const fetchServices = async () => {
      try {
        const res = await axiosClient.get('/clinic-admin/services/global');
        setGlobalServices(res.data);
      } catch (err) {
        console.error("Error fetching global services", err);
      }
    };
    fetchServices();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setFormData({ service_id: '', custom_service_name: '', consultation_fee: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditMode(true);
    setFormData({ service_id: dept.id, custom_service_name: '', consultation_fee: dept.consultation_fee });
    setIsModalOpen(true);
  };

  const handleDelete = (serviceId) => {
    setDepartmentToDelete(serviceId);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;
    try {
      await axiosClient.delete(`/clinic-admin/${clinicId}/departments/${departmentToDelete}`);
      if (refreshData) refreshData();
    } catch (err) {
      toast.error("Failed to delete department");
    } finally {
      setDepartmentToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axiosClient.put(`/clinic-admin/${clinicId}/departments/${formData.service_id}`, {
          consultation_fee: formData.consultation_fee
        });
      } else {
        await axiosClient.post(`/clinic-admin/${clinicId}/departments`, {
          service_id: formData.service_id,
          custom_service_name: formData.custom_service_name,
          consultation_fee: formData.consultation_fee
        });
      }
      setIsModalOpen(false);
      if (refreshData) refreshData();
    } catch (err) {
      console.error("Error saving department:", err);
      toast.error("Error saving department.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Departments & Services</h2>
          <p className="text-sm text-slate-500 mt-1">Manage clinic departments and consultation fees.</p>
        </div>
        <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[14px] px-5 py-2.5 font-bold shadow-sm transition-all hover:-translate-y-0.5">
          + Add Department
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {departments.map((dept) => {
          const Icon = iconMap[dept.name] || Activity;
          return (
            <div key={dept.id} className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative group">
              <div className="flex justify-between items-start mb-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-[18px] text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => openEditModal(dept)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{dept.name}</h3>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Fee</span>
                  <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-sm">₹{dept.consultation_fee}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative z-10 mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editMode ? 'Edit Department Fee' : 'Add Department'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!editMode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
                    <CustomDropdown 
                      value={formData.service_id} 
                      onChange={val => setFormData({...formData, service_id: val})} 
                      className="w-full"
                      options={[
                        { value: "", label: "-- Select a Service --" },
                        ...globalServices.map(srv => ({ value: srv.id.toString(), label: srv.name })),
                        { value: "custom", label: "Other (Create Custom)" }
                      ]}
                    />
                  </div>
                  
                  {formData.service_id === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom Department Name</label>
                      <input required type="text" placeholder="e.g. Acupuncture" value={formData.custom_service_name} onChange={e => setFormData({...formData, custom_service_name: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3" />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                <input required type="number" min="0" step="0.01" value={formData.consultation_fee} onChange={e => setFormData({...formData, consultation_fee: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal for Department Deletion */}
      <ConfirmModal
        isOpen={!!departmentToDelete}
        onClose={() => setDepartmentToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove Department?"
        message="Are you sure you want to remove this department from your clinic? This may affect associated doctors and appointments."
        confirmText="Yes, Remove"
        isDestructive={true}
      />
    </div>
  );
}
