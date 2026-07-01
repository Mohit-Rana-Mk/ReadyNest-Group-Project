import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import axiosClient from '../../../api/axiosClient';
import { Modal } from '../../../components/ui/Modal'; // Assuming Modal exists, if not, we build a simple one inline

export function StaffManagement({ staff, refreshData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'Doctor', status: 'Active', service_id: '' });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axiosClient.get(`/clinic-admin/1/departments`);
        setDepartments(res.data);
      } catch (e) {
        console.error("Failed to fetch departments", e);
      }
    };
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setFormData({ name: '', email: '', phone: '', role: 'Doctor', status: 'Active', service_id: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (staffMember) => {
    setEditMode(true);
    setSelectedStaff(staffMember);
    setFormData({ 
      name: staffMember.name, 
      email: '', // Backend doesn't return email currently, but required for add
      phone: '', 
      role: staffMember.role, 
      status: staffMember.status,
      service_id: staffMember.service_id || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const clinicId = 1; // hardcoded
      if (editMode) {
        await axiosClient.put(`/clinic-admin/${clinicId}/staff/${selectedStaff.id}`, {
          name: formData.name,
          role: formData.role,
          status: formData.status,
          service_id: formData.role === 'Doctor' ? formData.service_id : null
        });
      } else {
        await axiosClient.post(`/clinic-admin/${clinicId}/staff`, formData);
      }
      setIsModalOpen(false);
      if (refreshData) refreshData();
    } catch (err) {
      console.error("Error saving staff:", err);
      alert("Error saving staff. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-indigo-900">Staff Management</h2>
        <Button variant="primary" onClick={openAddModal}>Add New Staff</Button>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${member.role === 'Doctor' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="outline" className="py-1 px-3 text-xs" onClick={() => openEditModal(member)}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Simple Inline Modal if standard Modal isn't robust enough */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative z-10 mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editMode ? 'Edit Staff' : 'Add New Staff'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>
              
              {!editMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3">
                  <option value="Doctor">Doctor</option>
                  <option value="ClinicStaff">ClinicStaff</option>
                </select>
              </div>

              {formData.role === 'Doctor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department (Service)</label>
                  <select required value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3">
                    <option value="">Select Department...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-md py-2 px-3">
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Staff</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
