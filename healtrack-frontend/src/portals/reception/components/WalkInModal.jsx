import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Search, Loader2 } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function WalkInModal({ isOpen, onClose, onRegister, doctors = [] }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [doctor_id, setDoctorId] = useState('');
  const [preRemarks, setPreRemarks] = useState('');
  
  // Lookup states
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [existingPatients, setExistingPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Reset function
  const resetForm = () => {
    setPhone('');
    setName('');
    setDob('');
    setDoctorId('');
    setPreRemarks('');
    setExistingPatients([]);
    setSelectedPatientId('');
    setIsLookingUp(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Lookup Effect
  useEffect(() => {
    const lookup = async () => {
      if (phone.length >= 5) {
        setIsLookingUp(true);
        try {
          const res = await axiosClient.get(`/reception/1/lookup?phone=${phone}`);
          if (res.data.exists && res.data.patients) {
             setExistingPatients(res.data.patients);
             if (res.data.patients.length > 0) {
               setSelectedPatientId(res.data.patients[0].id.toString());
               setName(res.data.patients[0].name);
               setDob(res.data.patients[0].date_of_birth ? res.data.patients[0].date_of_birth.split('T')[0] : '');
             } else {
               setSelectedPatientId('new');
             }
          } else {
             setExistingPatients([]);
             setSelectedPatientId('new');
          }
        } catch (err) {
          console.error("Lookup failed", err);
        } finally {
          setIsLookingUp(false);
        }
      } else {
        setExistingPatients([]);
        setSelectedPatientId('');
      }
    };

    const timer = setTimeout(() => {
      lookup();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [phone]);

  // Handle dropdown change
  const handlePatientSelect = (e) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    
    if (val === 'new') {
      setName('');
      setDob('');
    } else {
      const pt = existingPatients.find(p => p.id.toString() === val);
      if (pt) {
        setName(pt.name);
        setDob(pt.date_of_birth ? pt.date_of_birth.split('T')[0] : '');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!doctor_id) return;
    if (selectedPatientId === 'new' && !name) return;

    onRegister({ 
      phone, 
      doctor_id, 
      patient_id: selectedPatientId === 'new' ? null : selectedPatientId,
      new_patient_name: selectedPatientId === 'new' ? name : null,
      dob: selectedPatientId === 'new' ? dob : null,
      pre_remarks: preRemarks
    });
    
    resetForm();
    onClose();
  };

  const isNewPatient = selectedPatientId === 'new' || existingPatients.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Walk-In Patient">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isLookingUp ? <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" /> : <Search className="h-4 w-4 text-gray-400" />}
            </div>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210 (Lookup Family)" 
              className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Enter phone to auto-fill existing family members.</p>
        </div>

        {existingPatients.length > 0 && (
          <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100">
            <label className="block text-sm font-medium text-indigo-900 mb-1">Select Family Member</label>
            <select 
              value={selectedPatientId}
              onChange={handlePatientSelect}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white outline-none"
            >
              {existingPatients.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.mrn ? `(${p.mrn})` : ''}</option>
              ))}
              <option value="new">+ Add New Family Member</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required={isNewPatient}
              disabled={!isNewPatient}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input 
              type="date" 
              disabled={!isNewPatient}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Doctor <span className="text-red-500">*</span></label>
          <select 
            required
            value={doctor_id}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white outline-none"
          >
            <option value="">Select a Doctor...</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Consultation Remarks</label>
          <textarea 
            value={preRemarks}
            onChange={(e) => setPreRemarks(e.target.value)}
            placeholder="e.g. Patient complaining of severe headache, BP taken by nurse is 120/80..."
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white outline-none min-h-[60px] resize-y"
          />
        </div>

        <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Register & Add to Queue</Button>
        </div>
      </form>
    </Modal>
  );
}
