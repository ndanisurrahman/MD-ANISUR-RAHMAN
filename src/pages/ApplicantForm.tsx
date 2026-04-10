import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, CheckCircle, Globe, LogIn, X, Search, Copy, Check, Calendar, MapPin } from 'lucide-react';
import { jobService, applicationService, machineService, skillService, factoryService } from '../services/firebaseService';
import { Job, Application, Machine, Skill, Factory } from '../types';
import { calculateAge, generateApplicationId, cn } from '../lib/utils';
import { sendTelegramNotification } from '../services/telegramService';
import { generatePDF } from '../services/pdfService';
import { geminiService, AssessmentQuestion } from '../services/geminiService';

const STEPS = 2;

export default function ApplicantForm() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<Application | null>(null);
  const [error, setError] = useState('');
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackId, setTrackId] = useState('');
  const [trackedApp, setTrackedApp] = useState<Application | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [copied, setCopied] = useState(false);

  // Assessment State
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<string[]>([]);
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<Application>>({
    name: '',
    dob: '',
    mobile: '',
    positionId: '',
    positionName: '',
    experience: '',
    machines: [],
    skills: [],
    currentlyEmployed: false,
    companyName: '',
    workedInGroup: false,
    factoryName: '',
    resignDate: '',
    resignReason: '',
    status: 'Applied',
  });

  const [dobParts, setDobParts] = useState({ day: '', month: '', year: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsData, machinesData, skillsData, factoriesData] = await Promise.all([
          jobService.getJobs(),
          machineService.getMachines(),
          skillService.getSkills(),
          factoryService.getFactories()
        ]);
        const activeJobs = jobsData.filter(j => new Date(j.deadline) >= new Date());
        setJobs(activeJobs);
        setMachines(machinesData);
        setSkills(skillsData);
        setFactories(factoriesData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  const handleNext = async () => {
    if (validateStep()) {
      if (step === 1) {
        const position = jobs.find(j => j.id === formData.positionId);
        if (position && (position.category === 'Staff' || position.category === 'Management')) {
          setAssessmentLoading(true);
          try {
            const questions = await geminiService.generateAssessment(
              position.category,
              position.title,
              'Garments'
            );
            setAssessmentQuestions(questions);
            setAssessmentAnswers(Array(questions.length).fill(''));
            setIsAssessmentActive(true);
          } catch (err) {
            console.error('Assessment generation failed:', err);
            setStep(s => Math.min(s + 1, STEPS));
          } finally {
            setAssessmentLoading(false);
          }
        } else {
          setStep(s => Math.min(s + 1, STEPS));
        }
      } else {
        setStep(s => Math.min(s + 1, STEPS));
      }
    }
  };

  const handleAssessmentAnswer = (answer: string) => {
    const newAnswers = [...assessmentAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setAssessmentAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate score
      let score = 0;
      assessmentQuestions.forEach((q, i) => {
        if (q.correctAnswer === assessmentAnswers[i]) {
          score++;
        }
      });
      setAssessmentScore(score);
      setIsAssessmentActive(false);
      setStep(2); // Move to next step after assessment
    }
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const validateStep = () => {
    setError('');
    if (step === 1) {
      // Basic Info
      if (!formData.name) return false;
      if (!dobParts.day || !dobParts.month || !dobParts.year) return false;
      const birthDate = new Date(`${dobParts.year}-${dobParts.month}-${dobParts.day}`);
      const age = calculateAge(birthDate);
      if (age < 18) {
        setError(t.ageError);
        return false;
      }
      formData.dob = `${dobParts.year}-${dobParts.month}-${dobParts.day}`;
      
      // Contact Info
      if (!formData.mobile || formData.mobile.length !== 11 || !/^\d+$/.test(formData.mobile)) {
        setError(t.mobileError);
        return false;
      }

      // Position
      if (!formData.positionId) return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const allApps = await applicationService.getApplications();
      const appId = generateApplicationId(allApps.length);
      const position = jobs.find(j => j.id === formData.positionId);
      
      const finalData: any = {
        ...formData,
        applicationId: appId,
        positionName: position?.title || '',
      };

      if (assessmentScore !== null) finalData.assessmentScore = assessmentScore;
      if (assessmentQuestions.length > 0) finalData.assessmentQuestions = assessmentQuestions;
      if (assessmentAnswers.length > 0) finalData.assessmentAnswers = assessmentAnswers;

      const docRef = await applicationService.addApplication(finalData as Omit<Application, 'id' | 'createdAt'>);
      const savedApp = { id: docRef?.id, ...finalData, createdAt: new Date().toISOString() } as Application;
      
      setSuccess(savedApp);
      
      // Telegram Notification
      const msg = `<b>New Application Received!</b>\n\nID: ${appId}\nName: ${savedApp.name}\nPosition: ${savedApp.positionName}\nMobile: ${savedApp.mobile}${assessmentScore !== null ? `\nAssessment Score: ${assessmentScore}/10` : ''}`;
      sendTelegramNotification(msg);
      
      // PDF Download
      generatePDF(savedApp);
    } catch (err: any) {
      if (err.message === 'REJECTED_USER') {
        setError(language === 'bn' ? 'দুঃখিত, আপনি ইতিপূর্বে রিজেক্ট হয়েছেন। আপনি আর আবেদন করতে পারবেন না।' : 'Sorry, you were previously rejected. You cannot apply again.');
      } else {
        setError(err.message === 'Duplicate mobile number' ? (language === 'bn' ? 'এই মোবাইল নাম্বার দিয়ে ইতিমধ্যে আবেদন করা হয়েছে' : 'Already applied with this mobile number') : err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId) return;
    setTrackLoading(true);
    setTrackError('');
    try {
      const app = await applicationService.getApplicationById(trackId);
      if (app) {
        setTrackedApp(app);
      } else {
        setTrackError(t.trackNotFound);
      }
    } catch (err) {
      setTrackError('Error tracking application');
    } finally {
      setTrackLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.success}</h2>
          
          {success.assessmentScore !== undefined && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm text-green-600 font-bold uppercase tracking-wider mb-1">{t.assessmentScore}</p>
              <p className="text-3xl font-black text-green-700">{success.assessmentScore} / 10</p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-xl mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">{t.applicationId}</p>
              <p className="text-xl font-mono font-bold text-blue-800">{success.applicationId}</p>
            </div>
            <button 
              onClick={() => copyToClipboard(success.applicationId)}
              className="p-3 bg-white text-blue-600 rounded-lg hover:bg-blue-100 transition-all shadow-sm"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {language === 'bn' ? 'নতুন আবেদন' : 'New Application'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
          <div className="w-full flex justify-between items-center mb-2">
            <div className="flex gap-2">
              <button 
                onClick={() => setIsTrackModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                {t.track}
              </button>
              <button 
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === 'bn' ? 'English' : 'বাংলা'}
              </button>
              <button 
                onClick={() => navigate('/admin/login')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                {language === 'bn' ? 'লগইন' : 'Login'}
              </button>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-black text-blue-900 uppercase tracking-tight">
              {language === 'bn' ? 'প্যাসিফিক অ্যাটায়ার্স লিঃ (পার্ট-বি)' : 'Pacific Attires Ltd. (Part-B)'}
            </h1>
            <p className="text-sm md:text-base font-bold text-gray-600 mt-1">
              {t.title}
            </p>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-xl mx-auto px-4 mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">{t.step} {step} / {STEPS}</span>
          <span className="text-sm font-medium text-blue-600">{Math.round((step / STEPS) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${(step / STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-xl mx-auto px-4 mt-8">
        {assessmentLoading ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-bold text-gray-900">{t.assessmentLoading}</p>
          </div>
        ) : isAssessmentActive ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-blue-900">{t.assessmentTitle}</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                {currentQuestionIndex + 1} / {assessmentQuestions.length}
              </span>
            </div>

            <div className="space-y-6">
              <p className="text-lg font-semibold text-gray-800">
                {assessmentQuestions[currentQuestionIndex].question}
              </p>

              <div className="space-y-3">
                {assessmentQuestions[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAssessmentAnswer(option)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all font-medium",
                      assessmentAnswers[currentQuestionIndex] === option
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-100 hover:border-blue-200 text-gray-600"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={!assessmentAnswers[currentQuestionIndex]}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {currentQuestionIndex === assessmentQuestions.length - 1 ? t.next : t.next}
              </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                    {t.basicInfo}
                  </h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t.name}</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder={language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t.dob}</label>
                    <div className="grid grid-cols-3 gap-3">
                      <select 
                        value={dobParts.day}
                        onChange={e => setDobParts({...dobParts, day: e.target.value})}
                        className="px-3 py-3 rounded-xl border border-gray-200 outline-none text-sm"
                      >
                        <option value="">{t.day}</option>
                        {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                          <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                        ))}
                      </select>
                      <select 
                        value={dobParts.month}
                        onChange={e => setDobParts({...dobParts, month: e.target.value})}
                        className="px-3 py-3 rounded-xl border border-gray-200 outline-none text-sm"
                      >
                        <option value="">{t.month}</option>
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                          <option key={m} value={String(m).padStart(2, '0')}>
                            {new Date(2000, m-1).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {month: 'short'})}
                          </option>
                        ))}
                      </select>
                      <select 
                        value={dobParts.year}
                        onChange={e => setDobParts({...dobParts, year: e.target.value})}
                        className="px-3 py-3 rounded-xl border border-gray-200 outline-none text-sm"
                      >
                        <option value="">{t.year}</option>
                        {Array.from({length: 50}, (_, i) => new Date().getFullYear() - 15 - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                    {t.contactInfo}
                  </h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t.mobile}</label>
                    <input 
                      type="tel"
                      maxLength={11}
                      value={formData.mobile}
                      onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Position Selection */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</span>
                    {t.positionSelect}
                  </h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t.position}</label>
                    <select 
                      value={formData.positionId}
                      onChange={e => setFormData({...formData, positionId: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                    >
                      <option value="">{t.select}</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                {/* Skills Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">4</span>
                    {t.skillsSection}
                  </h2>
                  
                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t.experience}</label>
                    <select 
                      value={formData.experience}
                      onChange={e => setFormData({...formData, experience: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                    >
                      <option value="">{t.select}</option>
                      {Array.from({length: 20}, (_, i) => i + 1).map(y => (
                        <option key={y} value={y}>{y} {language === 'bn' ? 'বছর' : 'Years'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Machine Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t.machines}</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.machines?.map(mId => {
                        const machine = machines.find(m => m.id === mId);
                        return (
                          <span key={mId} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            {machine?.name}
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => setFormData({
                                ...formData, 
                                machines: formData.machines?.filter(id => id !== mId),
                                skills: formData.skills?.filter(sId => {
                                  const skill = skills.find(s => s.id === sId);
                                  return skill?.machineId !== mId;
                                })
                              })} 
                            />
                          </span>
                        );
                      })}
                    </div>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !formData.machines?.includes(val)) {
                          setFormData({...formData, machines: [...(formData.machines || []), val]});
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">{t.select}</option>
                      {machines
                        .filter(m => {
                          const job = jobs.find(j => j.id === formData.positionId);
                          return m.category === job?.category;
                        })
                        .map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Skill Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t.skills}</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.skills?.map(sId => {
                        const skill = skills.find(s => s.id === sId);
                        return (
                          <span key={sId} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            {skill?.name}
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => setFormData({...formData, skills: formData.skills?.filter(id => id !== sId)})} 
                            />
                          </span>
                        );
                      })}
                    </div>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !formData.skills?.includes(val)) {
                          setFormData({...formData, skills: [...(formData.skills || []), val]});
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">{t.select}</option>
                      {skills
                        .filter(s => {
                          const job = jobs.find(j => j.id === formData.positionId);
                          // Filter by category
                          if (s.category !== job?.category) return false;
                          // If machine mapping exists, filter by selected machines
                          if (s.machineId && !formData.machines?.includes(s.machineId)) return false;
                          return true;
                        })
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.machineId ? `(${machines.find(m => m.id === s.machineId)?.name})` : ''}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Employment Status */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">5</span>
                    {t.employmentStatus}
                  </h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">{t.currentlyEmployed}</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setFormData({...formData, currentlyEmployed: true})}
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-semibold transition-all text-sm",
                          formData.currentlyEmployed ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600"
                        )}
                      >
                        {t.yes}
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, currentlyEmployed: false, companyName: ''})}
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-semibold transition-all text-sm",
                          !formData.currentlyEmployed ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600"
                        )}
                      >
                        {t.no}
                      </button>
                    </div>
                  </div>
                  {formData.currentlyEmployed && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{t.companyName}</label>
                      <input 
                        type="text"
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Group Experience */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">6</span>
                    {t.groupExperience}
                  </h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">{t.workedInGroup}</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setFormData({...formData, workedInGroup: true})}
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-semibold transition-all text-sm",
                          formData.workedInGroup ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600"
                        )}
                      >
                        {t.yes}
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, workedInGroup: false, factoryName: '', resignDate: '', resignReason: ''})}
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-semibold transition-all text-sm",
                          !formData.workedInGroup ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-600"
                        )}
                      >
                        {t.no}
                      </button>
                    </div>
                  </div>
                  {formData.workedInGroup && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.factoryName}</label>
                        <select 
                          value={formData.factoryName}
                          onChange={e => setFormData({...formData, factoryName: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                        >
                          <option value="">{t.select}</option>
                          {factories.map(f => (
                            <option key={f.id} value={f.name}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.resignDate}</label>
                        <input 
                          type="date"
                          value={formData.resignDate}
                          onChange={e => setFormData({...formData, resignDate: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.resignReason}</label>
                        <input 
                          type="text"
                          value={formData.resignReason}
                          onChange={e => setFormData({...formData, resignReason: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                          placeholder={language === 'bn' ? 'পদত্যাগের কারণ লিখুন' : 'Enter resign reason'}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-xl mx-auto flex gap-4">
          {step > 1 && (
            <button 
              onClick={handlePrev}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              {t.prev}
            </button>
          )}
          <button 
            onClick={step === STEPS ? handleSubmit : handleNext}
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {step === STEPS ? t.submit : t.next}
                {step !== STEPS && <ChevronRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Tracking Modal */}
      <AnimatePresence>
        {isTrackModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsTrackModalOpen(false);
                setTrackedApp(null);
                setTrackId('');
                setTrackError('');
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">{t.trackTitle}</h2>
                <button 
                  onClick={() => {
                    setIsTrackModalOpen(false);
                    setTrackedApp(null);
                    setTrackId('');
                    setTrackError('');
                  }} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {!trackedApp ? (
                  <form onSubmit={handleTrack} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t.applicationId}</label>
                      <input 
                        type="text"
                        required
                        value={trackId}
                        onChange={e => setTrackId(e.target.value.toUpperCase())}
                        placeholder={t.trackPlaceholder}
                        className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-mono text-lg"
                      />
                    </div>
                    {trackError && (
                      <p className="text-sm text-red-500 font-bold flex items-center gap-2">
                        <X className="w-4 h-4" /> {trackError}
                      </p>
                    )}
                    <button 
                      type="submit"
                      disabled={trackLoading}
                      className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                      {trackLoading ? '...' : t.trackButton}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-2xl text-center">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">{t.statusLabel}</p>
                      <h3 className={cn(
                        "text-2xl font-black uppercase",
                        trackedApp.status === 'Rejected' ? 'text-red-600' :
                        trackedApp.status === 'Selected' ? 'text-green-600' :
                        'text-blue-700'
                      )}>
                        {trackedApp.status}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">{t.applicationId}</p>
                          <p className="font-mono font-bold text-gray-900">{trackedApp.applicationId}</p>
                        </div>
                      </div>

                      {trackedApp.interviewDate && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-100">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-bold uppercase">{t.interviewDateLabel}</p>
                            <p className="font-bold text-purple-900">{new Date(trackedApp.interviewDate).toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {trackedApp.interviewLocation && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <MapPin className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-orange-600 font-bold uppercase">Location</p>
                            <p className="font-bold text-orange-900">{trackedApp.interviewLocation}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setTrackedApp(null)}
                      className="w-full py-4 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                    >
                      {language === 'bn' ? 'আবার খুঁজুন' : 'Track Another'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
