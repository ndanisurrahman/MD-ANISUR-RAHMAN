import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Wrench, X } from 'lucide-react';
import { skillService, machineService } from '../../services/firebaseService';
import { Skill, Machine } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function SkillManagement() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<Skill, 'id'>>({
    name: '',
    category: 'Worker',
    machineId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [skillsData, machinesData] = await Promise.all([
      skillService.getSkills(),
      machineService.getMachines()
    ]);
    setSkills(skillsData);
    setMachines(machinesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingSkill) {
        await skillService.updateSkill(editingSkill.id, formData);
      } else {
        await skillService.addSkill(formData);
      }
      setIsModalOpen(false);
      setEditingSkill(null);
      setFormData({ name: '', category: 'Worker', machineId: '' });
      loadData();
    } catch (err) {
      console.error('Error saving skill:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      await skillService.deleteSkill(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill / Process Management</h1>
          <p className="text-gray-500">Manage skills and map them to machines</p>
        </div>
        <button 
          onClick={() => {
            setEditingSkill(null);
            setFormData({ name: '', category: 'Worker', machineId: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Skill
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Skill Name</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Category</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Mapped Machine</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {skills.map((skill) => (
              <tr key={skill.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-900">{skill.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {skill.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {skill.machineId ? (
                    <span className="text-sm text-blue-600 font-medium">
                      {machines.find(m => m.id === skill.machineId)?.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">None</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingSkill(skill);
                        setFormData({ 
                          name: skill.name, 
                          category: skill.category,
                          machineId: skill.machineId || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(skill.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Name</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Pocket Attach"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                  >
                    <option value="Worker">Worker</option>
                    <option value="Staff">Staff</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                {formData.category === 'Worker' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Map to Machine (Optional)</label>
                    <select 
                      value={formData.machineId}
                      onChange={e => setFormData({...formData, machineId: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                    >
                      <option value="">None</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingSkill ? 'Update Skill' : 'Add Skill'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
