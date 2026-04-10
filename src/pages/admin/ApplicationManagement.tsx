import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Cpu,
  Wrench,
  History,
  Calendar,
  MapPin
} from 'lucide-react';
import { applicationService, machineService, skillService } from '../../services/firebaseService';
import { Application, Machine, Skill } from '../../types';
import { cn } from '../../lib/utils';
import { generatePDF } from '../../services/pdfService';
import { motion, AnimatePresence } from 'motion/react';

export default function ApplicationManagement() {
  const [apps, setApps] = useState<Application[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Application['status'] | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [appsData, machinesData, skillsData] = await Promise.all([
      applicationService.getApplications(),
      machineService.getMachines(),
      skillService.getSkills()
    ]);
    setApps(appsData);
    setMachines(machinesData);
    setSkills(skillsData);
    setLoading(false);
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         app.mobile.includes(searchTerm) ||
                         app.applicationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async () => {
    if (!selectedApp || !newStatus) return;
    setUpdating(true);
    try {
      const extra: Partial<Application> = {};
      if (newStatus === 'Rejected') {
        extra.rejectReason = statusNote;
      } else if (newStatus === 'Interview Called') {
        extra.interviewDate = interviewDate;
        extra.interviewLocation = interviewLocation;
      }

      await applicationService.updateApplicationStatus(selectedApp.id, newStatus as any, extra);
      await loadData();
      setIsStatusModalOpen(false);
      setSelectedApp(null);
      setNewStatus('');
      setStatusNote('');
      setInterviewDate('');
      setInterviewLocation('');
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-blue-50 text-blue-600';
      case 'Shortlisted': return 'bg-yellow-50 text-yellow-600';
      case 'Interview Called': return 'bg-purple-50 text-purple-600';
      case 'Selected': return 'bg-green-50 text-green-600';
      case 'Rejected': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (loading) return <div>Loading applications...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Management</h1>
          <p className="text-gray-500">Review and process job applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by name, phone or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-100 outline-none bg-gray-50/50 text-gray-600 font-medium"
          >
            <option value="All">All Status</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Called">Interview Called</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{app.name}</p>
                      <p className="text-sm text-gray-500">{app.mobile}</p>
                      <p className="text-[10px] font-mono text-blue-600 mt-1 uppercase">{app.applicationId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-700">{app.positionName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{app.experience ? `${app.experience} Years` : 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getStatusColor(app.status))}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => generatePDF(app)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Personal Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-bold text-gray-900">{selectedApp.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mobile Number</p>
                      <p className="font-bold text-gray-900">{selectedApp.mobile}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date of Birth</p>
                      <p className="font-bold text-gray-900">{selectedApp.dob}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Job Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Applied Position</p>
                      <p className="font-bold text-gray-900">{selectedApp.positionName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="font-bold text-gray-900">{selectedApp.experience || '0'} Years</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Application ID</p>
                      <p className="font-bold text-blue-600 font-mono">{selectedApp.applicationId}</p>
                    </div>
                    {selectedApp.assessmentScore !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500">Assessment Score</p>
                        <p className="text-lg font-black text-green-600">{selectedApp.assessmentScore} / 10</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Skills & Machines</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Cpu className="w-3 h-3" /> Selected Machines</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedApp.machines?.length ? selectedApp.machines.map(mId => (
                          <span key={mId} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">
                            {machines.find(m => m.id === mId)?.name || mId}
                          </span>
                        )) : <span className="text-sm text-gray-400 italic">None</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Wrench className="w-3 h-3" /> Selected Skills</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedApp.skills?.length ? selectedApp.skills.map(sId => (
                          <span key={sId} className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                            {skills.find(s => s.id === sId)?.name || sId}
                          </span>
                        )) : <span className="text-sm text-gray-400 italic">None</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employment History</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Currently Employed</p>
                    <p className="font-bold text-gray-900">{selectedApp.currentlyEmployed ? 'Yes' : 'No'}</p>
                    {selectedApp.companyName && <p className="text-sm text-gray-600 mt-1">{selectedApp.companyName}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pacific Jeans Group Exp</p>
                    <p className="font-bold text-gray-900">{selectedApp.workedInGroup ? 'Yes' : 'No'}</p>
                    {selectedApp.factoryName && (
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">{selectedApp.factoryName}</p>
                        <p className="text-xs text-gray-400">Resigned: {selectedApp.resignDate}</p>
                        {selectedApp.resignReason && (
                          <p className="text-xs text-red-500 mt-1 italic">Reason: {selectedApp.resignReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Status History</h3>
                <div className="space-y-3">
                  {selectedApp.statusHistory?.map((h, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="mt-1">
                        <History className="w-3 h-3 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{h.status}</p>
                        <p className="text-[10px] text-gray-500">{new Date(h.date).toLocaleString()}</p>
                        {h.note && <p className="text-xs text-gray-600 mt-1 italic">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                  {!selectedApp.statusHistory?.length && (
                    <p className="text-sm text-gray-400 italic">No history available</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['Shortlisted', 'Interview Called', 'Selected', 'Rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setNewStatus(status as any);
                        setIsStatusModalOpen(true);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        selectedApp.status === status 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                          : "border-gray-200 text-gray-600 hover:border-blue-400"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      <AnimatePresence>
        {isStatusModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Update to {newStatus}</h2>
                <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {newStatus === 'Rejected' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason</label>
                    <textarea 
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Why is this applicant being rejected?"
                    />
                  </div>
                )}

                {newStatus === 'Interview Called' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Date & Time</label>
                      <input 
                        type="datetime-local"
                        required
                        value={interviewDate}
                        onChange={e => setInterviewDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <input 
                        type="text"
                        required
                        value={interviewLocation}
                        onChange={e => setInterviewLocation(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Main Office, 3rd Floor"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsStatusModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleStatusUpdate}
                    disabled={updating}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
