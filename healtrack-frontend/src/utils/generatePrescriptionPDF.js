import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePrescriptionPDF = (appt, patientName, patientAge, patientGender) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // 1. Clinic Header
    // Left: Hospital Name in bold
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    const clinicName = appt.clinic_name || 'HealTrack Clinic';
    doc.text(clinicName, margin, 20);

    // Right: HealTrack written small
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'italic');
    doc.text('HealTrack', pageWidth - margin, 20, { align: 'right' });

    // Line separator
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(margin, 25, pageWidth - margin, 25);

    // 2. Body Details (Patient and Doctor Info)
    let cursorY = 35;
    doc.setFont('helvetica', 'normal');
    
    // Top Left: Patient Name
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient: ${patientName || 'Patient'}`, margin, cursorY);
    
    // Age below Patient Name
    cursorY += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // Slate-600
    let demographics = [];
    if (patientAge) demographics.push(`${patientAge} yrs`);
    if (patientGender) demographics.push(patientGender);
    doc.text(`Age/Gender: ${demographics.length > 0 ? demographics.join(' / ') : 'N/A'}`, margin, cursorY);

    // Appointment Date below Age
    cursorY += 6;
    const dateText = `Date: ${new Date(appt.appointment_date).toLocaleDateString()}`;
    doc.text(dateText, margin, cursorY);

    // Top Right: Doctor Name and Department
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    const doctorText = `Dr. ${appt.doctor_name || 'Unknown'}`;
    doc.text(doctorText, pageWidth - margin, 35, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    // We might not have a department string passed, fallback to 'Consultation'
    const deptText = `Dept: ${appt.department || 'General Consultation'}`;
    doc.text(deptText, pageWidth - margin, 41, { align: 'right' });

    // Reset cursor for main content
    cursorY += 15;

    // 3. Clinical Notes (Reason for Visit / Diagnosis)
    if (appt.pre_remarks) {
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Reason for Visit:', margin, cursorY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitPreRemarks = doc.splitTextToSize(appt.pre_remarks, pageWidth - (margin * 2));
        doc.text(splitPreRemarks, margin, cursorY + 6);
        cursorY += 8 + (splitPreRemarks.length * 5);
    }

    if (appt.post_remarks) {
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnosis & Notes:', margin, cursorY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitPostRemarks = doc.splitTextToSize(appt.post_remarks, pageWidth - (margin * 2));
        doc.text(splitPostRemarks, margin, cursorY + 6);
        cursorY += 8 + (splitPostRemarks.length * 5);
    }

    cursorY += 5;

    // 4. Prescriptions Table
    let rxs = [];
    try {
        rxs = typeof appt.prescriptions === 'string' ? JSON.parse(appt.prescriptions) : appt.prescriptions;
    } catch (e) {}

    if (Array.isArray(rxs)) {
        const validRxs = rxs.filter(rx => rx && rx.medicine_name);
        
        if (validRxs.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.text('Rx - Prescribed Medications', margin, cursorY);
            cursorY += 5;

            const tableData = validRxs.map((rx, index) => [
                index + 1,
                rx.medicine_name,
                rx.dosage || '-',
                rx.frequency || '-',
                rx.duration ? `${rx.duration} Days` : '-',
                rx.instructions || '-'
            ]);

            autoTable(doc, {
                startY: cursorY,
                head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }, // Slate-900
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 'auto' }
                },
                margin: { left: margin, right: margin }
            });
        }
    }

    // 5. Footer
    // Add separated line for footer
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

    // Small footer text
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('Generated electronically by HealTrack System. This is a valid digital prescription.', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Download the PDF
    doc.save(`Prescription_${patientName ? patientName.replace(/\s+/g, '_') : 'Patient'}_${new Date(appt.appointment_date).toISOString().split('T')[0]}.pdf`);
};
