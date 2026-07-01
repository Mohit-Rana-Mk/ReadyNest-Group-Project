import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Heart, Activity, Eye, Bone, Edit2, Trash2 } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

const iconMap = {
  'Cardiology': Heart,
  'General Medicine': Activity,
  'Ophthalmology': Eye,
  'Orthopedics': Bone
};

export function DepartmentManager({ departments, refreshData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [globalServices, setGlobalServices] = useState([]);
  const [formData, setFormData] = useState({ service_id: '', custom_service_name: '', consultation_fee: '' });
  
  const clinicId = 1;

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

  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to remove this department from your clinic?")) {
      try {
        await axiosClient.delete(`/clinic-admin/${clinicId}/departments/${serviceId}`);
        if (refreshData) refreshData();
      } catch (err) {
        alert("Failed to delete department");
      }
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
      alert("Error saving department.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">Departments & Services</h2>
        <Button variant="primary" onClick={openAddModal}>Add Department</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {departments.map((dept) => {
          const Icon = iconMap[dept.name] || Activity;
          return (
            <Card key={dept.id} className="p-6 border-t-4 hover:shadow-md transition-shadow relative" style={{ borderTopColor: '#3b82f6' }}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openEditModal(dept)} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(dept.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base Fee:</span>
                  <span className="font-semibold text-gray-900">₹{dept.consultation_fee}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative z-10 mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editMode ? 'Edit Department Fee' : 'Add Department'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!editMode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
                    <select required value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3">
                      <option value="" disabled>-- Select a Service --</option>
                      {globalServices.map(srv => (
                        <option key={srv.id} value={srv.id}>{srv.name}</option>
                      ))}
                      <option value="custom">Other (Create Custom)</option>
                    </select>
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
    </div>
  );
}
