import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function ReportUpload({ patientId, appointmentId, doctorId, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        setStatus({ type: 'loading', msg: 'Uploading report...' });

        const formData = new FormData();
        formData.append('report_file', file);
        formData.append('patient_id', patientId);
        formData.append('appointment_id', appointmentId);
        formData.append('doctor_id', doctorId);

        try {
            // Using raw axios to bypass the JSON interceptors if needed, 
            // but axiosClient should work if it handles FormData correctly
            const response = await axiosClient.post('/upload/report', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data && response.data.success) {
                setStatus({ type: 'success', msg: 'Report uploaded successfully!' });
                setFile(null);
                if (onUploadSuccess) onUploadSuccess(response.data.data);
                
                // Clear success message after 3 seconds
                setTimeout(() => setStatus(null), 3000);
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setStatus({ type: 'error', msg: error.response?.data?.message || 'Failed to upload report' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white border border-[#e9ecef] rounded-2xl shadow-sm flex flex-col shrink-0">
            <div className="p-4 border-b border-[#e9ecef] bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Attach Reports
                </h3>
            </div>
            
            <div className="p-5">
                {!file ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition text-center"
                    >
                        <UploadCloud className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="text-sm font-semibold text-emerald-800">Click to upload report</p>
                        <p className="text-[10px] text-emerald-600 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                        <input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept=".pdf,image/png,image/jpeg"
                        />
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 truncate pr-2">
                                <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                                <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                            </div>
                            <button 
                                onClick={() => { setFile(null); setStatus(null); }}
                                disabled={uploading}
                                className="text-slate-400 hover:text-red-500 shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Uploading...
                                </>
                            ) : 'Upload File'}
                        </button>
                    </div>
                )}

                {status && (
                    <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 text-sm ${
                        status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> :
                         status.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> :
                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mt-0.5 shrink-0"></div>}
                        <span className="font-medium">{status.msg}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
