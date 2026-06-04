import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../services/db';
import { getStudentAcademicReport, getStreamRankings } from './academicEngine';

// Colors for branding
const PRIMARY_COLOR = [79, 70, 229] as const; // #4f46e5 - Indigo
const SECONDARY_COLOR = [6, 182, 212] as const; // #06b6d4 - Teal
const TEXT_DARK = [15, 23, 42] as const; // Slate 900
const TEXT_LIGHT = [100, 116, 139] as const; // Slate 500
const LINE_COLOR = [226, 232, 240] as const; // Slate 200

export const generateReportCardPDF = (studentId: string, term = 'Term 1 2026'): void => {
  const report = getStudentAcademicReport(studentId, term);
  if (!report) {
    alert('Student report card data not found.');
    return;
  }

  const { student, streamName, subjectResults, overallTotal, overallAverage, overallGrade, overallRemark, classPosition, classTotalStudents } = report;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Branded Header Background Header
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // School Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('IKONEX ACADEMY', 14, 16);

  // Document Title
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('OFFICIAL STUDENT REPORT CARD', 14, 23);
  doc.text(`Academic Period: ${term}`, 14, 28);

  // Crest/Aesthetic block
  doc.setFillColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.rect(pageWidth - 45, 0, 45, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(32);
  doc.text('IX', pageWidth - 32, 22);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text('EXCELLENCE', pageWidth - 35, 30);

  // 2. Student Info Cards
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('STUDENT PROFILE', 14, 52);

  // Divider Line
  doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 54, pageWidth - 14, 54);

  // Student Profile Grid
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Student Name:', 14, 62);
  doc.text('Admission Number:', 14, 68);
  doc.text('Class Stream:', 14, 74);

  doc.setFont('Helvetica', 'normal');
  doc.text(`${student.firstName} ${student.lastName}`, 48, 62);
  doc.text(student.admissionNumber, 48, 68);
  doc.text(streamName, 48, 74);

  doc.setFont('Helvetica', 'bold');
  doc.text('Gender:', pageWidth / 2 + 10, 62);
  doc.text('Date of Birth:', pageWidth / 2 + 10, 68);
  doc.text('Enrolment Status:', pageWidth / 2 + 10, 74);

  doc.setFont('Helvetica', 'normal');
  doc.text(student.gender, pageWidth / 2 + 45, 62);
  doc.text(student.dateOfBirth, pageWidth / 2 + 45, 68);
  doc.text(student.status.toUpperCase(), pageWidth / 2 + 45, 74);

  // 3. Performance Summary Box
  doc.setFillColor(248, 250, 252); // Very light grey bg
  doc.rect(14, 82, pageWidth - 28, 24, 'F');
  doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setLineWidth(1);
  doc.line(14, 82, 14, 106); // Accent border on left

  // Summary labels
  doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OVERALL AVERAGE', 22, 90);
  doc.text('TOTAL MARKS', pageWidth / 3 + 12, 90);
  doc.text('CLASS RANK', (pageWidth / 3) * 2 + 2, 90);

  // Summary Values
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setFontSize(18);
  doc.text(`${overallAverage}%`, 22, 100);
  
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text(`${overallTotal} / ${report.overallMaxPossible}`, pageWidth / 3 + 12, 100);
  
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.text(`${classPosition} of ${classTotalStudents}`, (pageWidth / 3) * 2 + 2, 100);

  // Grade & Remarks
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.text(`Overall Grade: ${overallGrade}`, 22, 104);
  doc.text(`Principal's Comment: ${overallRemark}`, pageWidth / 3 + 12, 104);

  // 4. Subjects Table
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFontSize(12);
  doc.text('ACADEMIC SUBJECT PERFORMANCE', 14, 116);
  
  const headers = [['Code', 'Subject Name', 'CA (40)', 'Exam (60)', 'Total (100)', 'Grade', 'Pos', 'Class Avg', 'High', 'Low', 'Remark']];
  
  const data = subjectResults.map(res => [
    res.subjectCode,
    res.subjectName,
    res.caScore.toString(),
    res.examScore.toString(),
    res.totalScore.toString(),
    res.grade,
    `${res.subjectPosition}/${res.subjectTotalStudents}`,
    res.subjectAverage.toString(),
    res.subjectMax.toString(),
    res.subjectMin.toString(),
    res.remark
  ]);

  autoTable(doc, {
    startY: 120,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: {
      // fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      // textColor: TEXT_DARK,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 38 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Grading Scale Key
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY > pageHeight - 50) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text('Grading Scale Guide:', 14, finalY);

  const scale = db.getGradingScale().sort((a, b) => b.minScore - a.minScore);
  const scaleText = scale.map(s => `${s.grade}: ${s.minScore}-${Math.round(s.maxScore)}% (${s.remark})`).join('  |  ');
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(TEXT_LIGHT[0], TEXT_LIGHT[1], TEXT_LIGHT[2]);
  doc.text(scaleText, 14, finalY + 4, { maxWidth: pageWidth - 28 });

  // 6. Signatures block
  const sigY = finalY + 22;
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  
  doc.line(14, sigY, 64, sigY);
  doc.text('Class Teacher Signature', 14, sigY + 4);

  doc.line(pageWidth - 64, sigY, pageWidth - 14, sigY);
  doc.text('Principal Signature', pageWidth - 64, sigY + 4);

  // Save the report card
  const filename = `Report_Card_${student.lastName}_${student.firstName}_${term.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

export const generateClassPerformancePDF = (streamId: string, term = 'Term 1 2026'): void => {
  const stream = db.getStream(streamId);
  if (!stream) {
    alert('Stream not found.');
    return;
  }

  const rankings = getStreamRankings(streamId, term);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('IKONEX ACADEMY', 14, 14);
  
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'normal');
  doc.text(`CLASS PERFORMANCE REPORT - ${stream.name}`, 14, 21);
  doc.text(`Term: ${term}  |  Enrolled Students: ${rankings.length}`, 14, 26);

  // Performance stats box
  const totalAvg = rankings.length > 0 
    ? rankings.reduce((sum, r) => sum + r.averageScore, 0) / rankings.length 
    : 0;

  doc.setFillColor(248, 250, 252);
  doc.rect(14, 42, pageWidth - 28, 16, 'F');
  
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Class Average Score: ${Math.round(totalAvg * 100) / 100}%`, 20, 52);
  
  if (rankings.length > 0) {
    doc.text(`Top Performer: ${rankings[0].firstName} ${rankings[0].lastName} (${rankings[0].averageScore}%)`, pageWidth / 2, 52);
  }

  // Table
  const headers = [['Rank', 'Admission No', 'Student Name', 'Total Marks', 'Average', 'Overall Grade', 'Remarks']];
  
  const data = rankings.map(r => [
    r.rank.toString(),
    r.admissionNumber,
    `${r.firstName} ${r.lastName}`,
    r.totalMarks.toString(),
    `${Math.round(r.averageScore * 100) / 100}%`,
    r.grade,
    r.remark
  ]);

  autoTable(doc, {
    startY: 64,
    head: headers,
    body: data,
    theme: 'striped',
    headStyles: {
      // fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      // textColor: TEXT_DARK,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 30 },
      2: { cellWidth: 50 },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  const filename = `Class_Performance_${stream.name.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
