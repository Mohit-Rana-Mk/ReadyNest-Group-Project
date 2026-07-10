import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import axiosClient from '../../../api/axiosClient';
import { Modal } from '../../../components/ui/Modal'; // Assuming Modal exists, if not, we build a simple one inline

export function StaffManagement({ staff, refreshData, clinicId = 1 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'Doctor', status: 'Active', service_id: '', password: '', country_code: '+91' });
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axiosClient.get(`/clinic-admin/${clinicId}/departments`);
        setDepartments(res.data);
      } catch (e) {
        console.error("Failed to fetch departments", e);
      }
    };
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditMode(false);
    setCreatedCredentials(null);
    setFormData({ name: '', email: '', phone: '', role: 'Doctor', status: 'Active', service_id: '', password: '', country_code: '+91' });
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
      if (editMode) {
        await axiosClient.put(`/clinic-admin/${clinicId}/staff/${selectedStaff.id}`, {
          name: formData.name,
          role: formData.role,
          status: formData.status,
          service_id: formData.role === 'Doctor' ? formData.service_id : null
        });
        setIsModalOpen(false);
      } else {
        const phoneVal = formData.phone.trim();
        const combinedPhone = phoneVal 
            ? (phoneVal.startsWith('+') ? phoneVal : `${formData.country_code}${phoneVal}`)
            : '';
        const payload = { 
          ...formData,
          phone: combinedPhone 
        };
        if (formData.role !== 'Doctor') {
          delete payload.service_id;
        }
        const res = await axiosClient.post(`/clinic-admin/${clinicId}/staff`, payload);
        if (res.data.credentials) {
            setCreatedCredentials(res.data.credentials);
        } else {
            setIsModalOpen(false);
        }
      }
      if (refreshData) refreshData();
    } catch (err) {
      console.error("Error saving staff:", err);
      alert("Error saving staff. Please try again.");
    }
  };

  const handleDelete = async (member) => {
    if (window.confirm(`Are you sure you want to permanently delete ${member.name} (${member.role})? This will also remove any related schedules and appointments.`)) {
      try {
        await axiosClient.delete(`/clinic-admin/${clinicId}/staff/${member.id}`);
        if (refreshData) refreshData();
      } catch (err) {
        console.error("Error deleting staff:", err);
        alert("Failed to delete staff member.");
      }
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
                    <Button variant="outline" className="py-1 px-3 text-xs ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300" onClick={() => handleDelete(member)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 mx-4">
            {!createdCredentials && (
            <form onSubmit={handleSubmit} className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editMode ? 'Edit Staff' : 'Add New Staff'}</h3>
              <div className="space-y-4">
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
                      <div className="flex gap-2">
                        <select
                          value={formData.country_code}
                          onChange={e => setFormData({...formData, country_code: e.target.value})}
                          className="border border-gray-300 rounded-md py-2 px-2 bg-white text-sm outline-none"
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+966">🇸🇦 +966</option>
                        </select>
                        <input 
                          required 
                          type="text" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          className="flex-1 border border-gray-300 rounded-md py-2 px-3 outline-none" 
                        />
                      </div>
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

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Set Password</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Auto-generated if left blank"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-700/50 focus:ring-1 focus:ring-indigo-700/10 transition"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const randomStr = Math.random().toString(36).slice(-4);
                                    setFormData({ ...formData, password: `HT@staff${randomStr}` });
                                }}
                                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
                            >
                                Auto-Gen
                            </button>
                        </div>
                        <p className="mt-1 text-[9px] text-slate-400 leading-relaxed font-medium">
                            Must consist of at least 6 characters, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                        </p>
                    </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editMode ? 'Save Changes' : 'Add Staff'}</Button>
              </div>
            </form>
          )}

          {createdCredentials && (
            <div className="p-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center space-y-3">
                    <h4 className="text-emerald-800 font-bold text-sm">Staff Account Created!</h4>
                    <p className="text-xs text-emerald-600">Please share these credentials securely with the new staff member.</p>
                    <div className="bg-white rounded-lg p-3 inline-block text-left shadow-sm border border-emerald-100/50">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Email / Username:</div>
                        <div className="text-sm font-bold text-slate-800 mb-2">{createdCredentials.email}</div>
                        <div className="text-xs text-slate-500 font-semibold mb-1">Password:</div>
                        <div className="text-sm font-bold text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded inline-block">{createdCredentials.password}</div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end pt-4 border-t border-slate-100">
                    <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
