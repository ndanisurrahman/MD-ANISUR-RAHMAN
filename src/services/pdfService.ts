import { jsPDF } from 'jspdf';
import { Application } from '../types';

export function generatePDF(application: Application) {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text('Job Application Details', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Application ID: ${application.applicationId}`, 20, 40);
  doc.text(`Name: ${application.name}`, 20, 50);
  doc.text(`Mobile: ${application.mobile}`, 20, 60);
  doc.text(`Position: ${application.positionName}`, 20, 70);
  doc.text(`Date of Birth: ${application.dob}`, 20, 80);
  
  if (application.experience) {
    doc.text(`Experience: ${application.experience} years`, 20, 90);
  }
  
  doc.text(`Currently Employed: ${application.currentlyEmployed ? 'Yes' : 'No'}`, 20, 100);
  if (application.companyName) {
    doc.text(`Company Name: ${application.companyName}`, 20, 110);
  }
  
  doc.text(`Worked in Group: ${application.workedInGroup ? 'Yes' : 'No'}`, 20, 120);
  if (application.factoryName) {
    doc.text(`Factory Name: ${application.factoryName}`, 20, 130);
    doc.text(`Resign Date: ${application.resignDate}`, 20, 140);
  }
  
  if (application.assessmentScore !== undefined) {
    doc.text(`Assessment Score: ${application.assessmentScore} / 10`, 20, 150);
  }
  
  doc.text(`Status: ${application.status}`, 20, 160);
  doc.text(`Applied On: ${new Date(application.createdAt).toLocaleDateString()}`, 20, 170);
  
  doc.save(`Application_${application.applicationId}.pdf`);
}
