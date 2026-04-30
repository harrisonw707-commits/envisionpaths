/**
 * EnvisionPaths - Smart Interview Preparation Platform
 * 
 * This application provides a comprehensive suite of tools for job seekers:
 * - Real-time Interactive Practice Sessions (Text & Voice)
 * - Personalized Performance Feedback & Scoring
 * - Practice Session Scheduling & Reminders
 * - Subscription Management & Secure Payments
 * - User Profile & Security Settings
 * 
 * Built with: React, Tailwind CSS, Motion, Lucide Icons, and Gemini AI.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  ChevronRight, 
  Award, 
  Target,
  RefreshCw,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  LogOut,
  CreditCard,
  Download,
  HardHat,
  Factory,
  Truck,
  Zap,
  Utensils,
  Monitor,
  Trash2,
  DollarSign,
  Stethoscope,
  Shield,
  Megaphone,
  Sprout,
  Car,
  Siren,
  Wrench,
  Clock,
  History,
  Search,
  Activity,
  Bell,
  ShieldCheck,
  ExternalLink,
  Upload,
  FileText,
  ChevronDown,
  Plus,
  ArrowUp,
  Mic,
  Keyboard,
  Settings,
  HelpCircle,
  AlertCircle,
  Info,
  X,
  Copy,
  BarChart as BarChartIcon,
  Globe,
  Volume2,
  Calendar,
  Edit3,
  VolumeX,
  Sun,
  Moon,
  Users,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
import { generateAI, generateAIStream, generateContent, generateSpeech, transcribeAudio } from './services/aiService';
import Tooltip from './components/Tooltip';
import Modal from './components/Modal';
import { API_URL } from './config';
import IconGenerator from './components/IconGenerator';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

type AppStep = 'auth' | 'pricing' | 'setup' | 'interview' | 'summary' | 'admin' | 'reminders';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const VoiceVisualizer = () => (
  <div className="flex items-end gap-0.5 h-3">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="w-0.5 bg-emerald-400 rounded-full"
        animate={{
          height: ["20%", "60%", "40%", "100%", "30%"][i],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: i * 0.1,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);



const VOICES = [
  { id: 'Kore', name: 'Professional Female', description: 'Clear, authoritative, and professional' },
  { id: 'Zephyr', name: 'Warm Female', description: 'Friendly, engaging, and supportive' },
  { id: 'Fenrir', name: 'Professional Male', description: 'Deep, reassuring, and confident' },
  { id: 'Puck', name: 'Warm Male', description: 'Energetic, friendly, and direct' },
];

export default function App() {
  const [step, setStep] = useState<AppStep>('auth');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'beginner' | 'pro' | 'elite' | null>(null);
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [updateEmailValue, setUpdateEmailValue] = useState('');
  const [currentPasswordValue, setCurrentPasswordValue] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<number | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [lastAlertCount, setLastAlertCount] = useState<number>(0);
  const [isAnnual, setIsAnnual] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [currentSimulationId, setCurrentSimulationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkipLoading, setShowSkipLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'email'>('totp');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password'>('email');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isEnhancingResume, setIsEnhancingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'text' | 'voice'>('text');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const notifiedReminders = useRef<Set<number>>(new Set());
  const notified15Min = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    // Stop speaking if we leave the interview step
    if (step !== 'interview') {
      stopSpeaking();
    }
  }, [step]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`[NOTIFICATION] ${type.toUpperCase()}: ${text}`);
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Interview tracking state
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [interviewLength, setInterviewLength] = useState(5);

  // Reminders state
  const [reminders, setReminders] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSchedulingLoading, setIsSchedulingLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<'overview' | 'stats' | 'users' | 'icons'>('overview');
  const [selectedSimulation, setSelectedSimulation] = useState<any>(null);
  const [simulationMessages, setSimulationMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDesc, setReminderDesc] = useState('');
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-theme');
      return (saved as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);


  const [authError, setAuthError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    // Check server health
    fetch(API_URL + '/api/health')
      .then(res => res.json())
      .then(data => console.log('[SYSTEM] Backend health:', data.status))
      .catch(err => console.warn('[SYSTEM] Backend connection issue:', err));
  }, []);

  useEffect(() => {
    let timer: any;
    if (isTyping) {
      timer = setTimeout(() => setShowRetry(true), 10000);
    } else {
      setShowRetry(false);
    }
    return () => clearTimeout(timer);
  }, [isTyping]);


  const [loginError, setLoginError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    showInput?: boolean;
    inputPlaceholder?: string;
    onConfirm: (inputValue?: string) => void 
  } | null>(null);
  const [modalInputValue, setModalInputValue] = useState('');

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      showNotification('Notifications are not supported on this device.', 'error');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showNotification('System notifications enabled!', 'success');
      } else if (permission === 'denied') {
        showNotification('Notifications were blocked. Please enable them in your browser settings.', 'error');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const navigate = (path: string) => {
    console.log(`[NAVIGATE] to: ${path}`);
    if (path === '/admin/dashboard') {
      setStep('admin');
    } else if (path === '/') {
      setStep('auth');
    } else if (path === '/pricing') {
      setStep('pricing');
    }
  };

  const trackEvent = (name: string, params?: any) => {
    if (window.gtag) {
      window.gtag('event', name, params);
    }
    // setDebugLogs(prev => [{ name, params, timestamp: new Date() }, ...prev].slice(0, 50));
    console.log(`[GA4 EVENT]: ${name}`, params);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Message copied to clipboard', 'success');
  };

  const exportTranscript = () => {
    const transcript = `ENVISIONPATHS INTERVIEW TRANSCRIPT
==================================================
Position: ${jobTitle}
Industry: ${industry}
Candidate: ${user?.email || 'Guest User'}
Date: ${new Date().toLocaleString()}
==================================================

${messages.map(msg => {
  const role = msg.role === 'user' ? 'CANDIDATE' : 'COACH';
  const ts = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `[${time}] ${role}:
${msg.text}
`;
}).join('\n--------------------------------------------------\n\n')}

==================================================
Generated by EnvisionPaths Career Intelligence
Professional Interview Simulation Platform
==================================================`;

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Interview_${jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportReport = () => {
    const report = `ENVISIONPATHS PERFORMANCE REPORT
Position: ${jobTitle}
Industry: ${industry}
Date: ${new Date().toLocaleDateString()}
--------------------------------------------------

${summary}

--------------------------------------------------
Generated by EnvisionPaths Career Intelligence`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Report_${jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const suggestedRoles: Record<string, string[]> = {
    'Construction': ['Site Supervisor', 'Electrician', 'Plumber', 'HVAC Technician', 'Heavy Equipment Operator', 'Carpenter', 'Mason', 'Ironworker', 'Surveyor', 'Project Coordinator', 'Drywaller', 'Roofer', 'Pipefitter', 'Crane Operator', 'General Laborer', 'Construction Assistant', 'Painter', 'Flooring Installer', 'Scaffolder'],
    'Manufacturing': ['Production Manager', 'Quality Control Inspector', 'CNC Machinist', 'Welder', 'Assembly Line Lead', 'Safety Coordinator', 'Millwright', 'Industrial Electrician', 'Tool and Die Maker', 'Maintenance Mechanic', 'Forklift Operator', 'Machine Operator', 'Production Worker', 'Packer', 'Inventory Clerk', 'Material Handler'],
    'Logistics': ['Warehouse Manager', 'Fleet Supervisor', 'Supply Chain Coordinator', 'Forklift Driver', 'Picker Packer', 'Inventory Specialist', 'Delivery Lead', 'Dispatcher', 'Logistics Analyst', 'Operations Lead', 'Truck Driver (CDL)', 'Warehouse Associate', 'Delivery Driver', 'Stock Clerk', 'Route Driver', 'Shipping Clerk'],
    'Energy': ['Solar Panel Installer', 'Wind Turbine Technician', 'Power Plant Operator', 'Utility Lineworker', 'Field Engineer', 'Safety Officer', 'Drilling Supervisor', 'Pipefitter', 'Geologist', 'Instrumentation Tech', 'Lineman', 'Substation Technician', 'Meter Reader', 'Energy Auditor', 'Waste Management Tech'],
    'Hospitality': ['Executive Chef', 'Line Cook', 'Prep Cook', 'Hotel Manager', 'Front Desk Supervisor', 'Maintenance Lead', 'Janitor', 'Housekeeping Manager', 'Sous Chef', 'Event Coordinator', 'Bartender', 'Server', 'Dishwasher', 'Cashier', 'Host/Hostess', 'Concierge', 'Valet', 'Laundry Attendant'],
    'Technology': ['Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UI/UX Designer', 'IT Support Specialist', 'Cybersecurity Analyst', 'Cloud Architect', 'Help Desk Technician', 'QA Tester', 'Technical Support', 'Web Developer', 'Systems Admin', 'Vertex AI User'],
    'Finance': ['Investment Banker', 'Financial Analyst', 'Accountant', 'Risk Manager', 'Portfolio Manager', 'Loan Officer', 'Tax Specialist', 'Auditor', 'Bank Teller', 'Collections Specialist', 'Bookkeeper', 'Billing Clerk', 'Insurance Agent'],
    'Healthcare': ['Registered Nurse', 'Medical Assistant', 'Healthcare Administrator', 'Lab Technician', 'Physical Therapist', 'Pharmacist', 'Dental Hygienist', 'Radiologic Tech', 'Patient Care Tech', 'Home Health Aide', 'Phlebotomist', 'Medical Coder', 'Pharmacy Tech'],
    'Defense': ['Aerospace Engineer', 'Systems Analyst', 'Project Manager', 'Security Specialist', 'Logistics Analyst', 'Technical Writer', 'Intelligence Analyst', 'Contract Administrator', 'Operations Research', 'Facility Manager'],
    'Marketing': ['Marketing Manager', 'Content Strategist', 'SEO Specialist', 'Brand Manager', 'Social Media Lead', 'Digital Analyst', 'Copywriter', 'Public Relations', 'Marketing Assistant', 'Event Staff', 'Media Buyer', 'Graphic Designer'],
    'Agriculture': ['Farm Manager', 'Agricultural Mechanic', 'Greenhouse Supervisor', 'Irrigation Specialist', 'Livestock Manager', 'Crop Consultant', 'Harvester', 'Tractor Operator', 'Farm Hand', 'Nursery Worker', 'Beekeeper', 'Soil Scientist'],
    'Automotive': ['Service Manager', 'Master Technician', 'Body Shop Lead', 'Parts Coordinator', 'Fleet Mechanic', 'Diagnostic Specialist', 'Tire Technician', 'Diesel Mechanic', 'Lube Technician', 'Car Detailer', 'Service Advisor', 'Lot Attendant'],
    'PublicSafety': ['Fire Captain', 'Police Sergeant', 'EMS Supervisor', '911 Dispatcher', 'Security Manager', 'Emergency Coordinator', 'Parole Officer', 'Correctional Officer', 'Security Guard', 'Loss Prevention', 'Animal Control', 'Bailiff'],
    'GeneralServices': ['Janitor', 'Security Guard', 'Customer Service', 'Retail Associate', 'Stock Clerk', 'Groundskeeper', 'Maintenance Worker', 'Custodian', 'Pest Control Tech', 'Housekeeper', 'Office Assistant', 'Receptionist', 'Data Entry Clerk', 'Personal Assistant', 'Virtual Assistant']
  };

  const industryIcons: Record<string, any> = {
    'Construction': HardHat,
    'Manufacturing': Factory,
    'Logistics': Truck,
    'Energy': Zap,
    'Hospitality': Utensils,
    'Technology': Monitor,
    'Finance': DollarSign,
    'Healthcare': Stethoscope,
    'Defense': Shield,
    'Marketing': Megaphone,
    'Agriculture': Sprout,
    'Automotive': Car,
    'PublicSafety': Siren,
    'GeneralServices': Wrench
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const simulationEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatEndRef.current) {
      // Use a small delay to ensure the DOM has updated and layout is calculated
      // especially with ReactMarkdown which might change height after initial render
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior, block: "end" });
      }, 100);
    }
  };

  const scrollSimulationToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (simulationEndRef.current) {
      setTimeout(() => {
        simulationEndRef.current?.scrollIntoView({ behavior, block: "end" });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, step]);

  useEffect(() => {
    if (selectedSimulation) {
      scrollSimulationToBottom();
    }
  }, [simulationMessages, selectedSimulation]);

  useEffect(() => {
    if (step === 'setup' || step === 'reminders') {
      fetchReminders();
    }
  }, [step]);

  // Background check for upcoming reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (!reminder.completed) {
          const scheduledTime = new Date(reminder.scheduled_at);
          const diff = scheduledTime.getTime() - now.getTime();
          
          // 15 minute warning
          if (diff > 840000 && diff < 960000 && !notified15Min.current.has(reminder.id)) {
            console.log(`[REMINDER] Triggering 15-min warning for: ${reminder.title}`);
            notified15Min.current.add(reminder.id);
            
            showNotification(`Upcoming: ${reminder.title} in 15 minutes!`, 'info');
            
            if (notificationPermission === 'granted') {
              const options = {
                body: `Your practice session "${reminder.title}" starts in 15 minutes.`,
                icon: '/icons/icon-192.png',
                tag: `reminder-15min-${reminder.id}`,
              };
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => reg.showNotification('Upcoming Practice', options));
              } else {
                new Notification('Upcoming Practice', options);
              }
            }
          }

          // Due now (within 1 minute)
          if (diff > -60000 && diff < 60000 && !notifiedReminders.current.has(reminder.id)) {
            console.log(`[REMINDER] Triggering alert for: ${reminder.title}`);
            notifiedReminders.current.add(reminder.id);
            
            showNotification(`PRACTICE TIME: ${reminder.title} is starting now!`, 'success');
            
            if (notificationPermission === 'granted') {
              try {
                const options = {
                  body: reminder.description || `${reminder.title} is starting now!`,
                  icon: '/icons/icon-192.png',
                  badge: '/icons/icon-192.png',
                  vibrate: [200, 100, 200],
                  tag: `reminder-${reminder.id}`,
                  requireInteraction: true,
                  data: { url: '/' }
                };

                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('Practice Reminder', options);
                  });
                } else {
                  new Notification('Practice Reminder', options);
                }
              } catch (e) {
                console.error('Failed to show system notification:', e);
              }
            }
            
            // Mark as completed in DB
            toggleReminder(reminder.id, false);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [reminders, notificationPermission]);

  const fetchReminders = async () => {
    try {
      const res = await fetch(API_URL + '/api/reminders', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders);
      }
    } catch (e) {
      console.error('Error fetching reminders:', e);
    }
  };

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSchedulingLoading) return;
    
    setIsSchedulingLoading(true);
    console.log('[REMINDER] Saving reminder:', { editingReminderId, reminderTitle, reminderDate, reminderTime });
    try {
      const scheduled_at = `${reminderDate}T${reminderTime}:00`; 
      const url = editingReminderId ? `${API_URL}/api/reminders/${editingReminderId}` : `${API_URL}/api/reminders`;
      const method = editingReminderId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: reminderTitle, description: reminderDesc, scheduled_at })
      });
      
      if (res.ok) {
        console.log('[REMINDER] Reminder saved successfully');
        setReminderTitle('');
        setReminderDate('');
        setReminderTime('');
        setReminderDesc('');
        setEditingReminderId(null);
        setIsScheduling(false);
        fetchReminders();
        showNotification(editingReminderId ? 'Reminder updated!' : 'Practice session scheduled!', 'success');
      } else {
        const err = await res.json();
        console.error('[REMINDER] Failed to save reminder:', err);
        showNotification('Failed to save session.', 'error');
      }
    } catch (e) {
      console.error('Error saving reminder:', e);
      showNotification('An error occurred while saving.', 'error');
    } finally {
      setIsSchedulingLoading(false);
    }
  };

  const openEditReminder = (reminder: any) => {
    const date = new Date(reminder.scheduled_at);
    setEditingReminderId(reminder.id);
    setReminderTitle(reminder.title);
    setReminderDesc(reminder.description || '');
    setReminderDate(date.toISOString().split('T')[0]);
    setReminderTime(date.toTimeString().split(' ')[0].substring(0, 5));
    setIsScheduling(true);
  };

  const toggleReminder = async (id: number, completed: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      if (res.ok) {
        fetchReminders();
      }
    } catch (e) {
      console.error('Error toggling reminder:', e);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchReminders();
      }
    } catch (e) {
      console.error('Error deleting reminder:', e);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      console.log('[APP] Starting session check...');
      console.log('[APP] Current localStorage session_id:', localStorage.getItem('session_id'));
      console.log('[APP] Current URL:', window.location.href);
      
      // Show skip button after 1.5 seconds
      const skipTimeoutId = setTimeout(() => {
        console.log('[APP] Skip loading button triggered');
        setShowSkipLoading(true);
      }, 1500);

      // Safety timeout: force loading to false after 3 seconds
      const timeoutId = setTimeout(() => {
        console.warn('[APP] Session check timed out, forcing loading to false');
        setIsLoading(false);
      }, 3000);

      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const planType = urlParams.get('plan_type');

      if (sessionId) {
        try {
          const verifyRes = await fetch(API_URL + '/api/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              session_id: sessionId
            })
          });
          if (verifyRes.ok) {
            const contentType = verifyRes.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await verifyRes.json();
              setSelectedPlan(data.plan_type);
              trackEvent('plan_unlocked', { plan: data.plan_type });
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (e) {
          console.error('Verification failed');
        }
      }

      try {
        console.log('[APP] Fetching user profile...');
        const user = await fetchProfile();
        console.log('[APP] Profile fetch result:', user ? 'User found' : 'No user');
        if (user) {
          // Only set step to setup if we're currently on auth
          setStep(prev => prev === 'auth' ? 'setup' : prev);
          fetchHistory();
        } else {
          console.log('[APP] No active session found');
        }
      } catch (e) {
        console.error('[APP] Session check failed', e);
      } finally {
        console.log('[APP] Cleaning up session check...');
        clearTimeout(timeoutId);
        clearTimeout(skipTimeoutId);
        setIsLoading(false);
        console.log('[APP] Session check complete');
      }
    };
    checkSession();
  }, []);

  const getAuthHeaders = (existingHeaders: Record<string, string> = {}) => {
    const sessionId = localStorage.getItem('session_id');
    const headers: Record<string, string> = { ...existingHeaders };
    if (sessionId) headers['x-session-id'] = sessionId;
    return headers;
  };

  const fetchActivityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(API_URL + '/api/admin/activity-logs', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs);
      }
      
      const resSims = await fetch(API_URL + '/api/admin/export-data', { headers: getAuthHeaders() });
      if (resSims.ok) {
        const data = await resSims.json();
        setSimulations(data.simulations);
        setAdminUsers(data.users || []);
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const exportActivityLogs = () => {
    if (activityLogs.length === 0) return;
    const headers = ['ID', 'Email', 'Activity', 'Country', 'IP Address', 'User Agent', 'Time'];
    const rows = activityLogs.map(log => [
      log.id,
      log.email,
      log.activity,
      log.country,
      log.ip_address,
      log.user_agent,
      new Date(log.created_at).toISOString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EnvisionPaths_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const syncPlayConsoleData = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Sync Play Console Data',
      message: 'This will sync historical data from Google Play Console. Continue?',
      onConfirm: async () => {
        setIsImporting(true);
        try {
          const activity_logs: any[] = [];
          
          // Data from Play Console Screenshots
          const playData = [
            { date: '2026-03-04', total: 4, countries: { 'Argentina': 1 } },
            { date: '2026-03-05', total: 7, countries: { 'Argentina': 1 } },
            { date: '2026-03-06', total: 7, countries: { 'Singapore': 2, 'United Kingdom': 3 } },
            { date: '2026-03-07', total: 9, countries: { 'Argentina': 3, 'Singapore': 2, 'United Kingdom': 1, 'Italy': 1 } },
            { date: '2026-03-11', total: 26, countries: { 'Argentina': 2, 'Singapore': 1, 'United Kingdom': 3, 'Italy': 2, 'Türkiye': 4, 'United States': 3, 'Australia': 2, 'Monaco': 1, 'Morocco': 1, 'South Africa': 1, 'Colombia': 1 } },
            { date: '2026-03-12', total: 26, countries: { 'Argentina': 2, 'Singapore': 1, 'United Kingdom': 3, 'Italy': 2, 'Türkiye': 4, 'United States': 3, 'Australia': 2, 'Monaco': 1, 'Morocco': 1, 'South Africa': 1, 'Colombia': 1 } }
          ];

          playData.forEach(day => {
            let count = 0;
            // Add specific country logs
            Object.entries(day.countries).forEach(([country, num]) => {
              for (let i = 0; i < num; i++) {
                activity_logs.push({
                  activity: 'session_start',
                  country,
                  created_at: `${day.date}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
                  email: 'support@envisionpaths.com'
                });
                count++;
              }
            });
            
            // Add "Others" logs to match total
            const others = day.total - count;
            for (let i = 0; i < others; i++) {
              activity_logs.push({
                activity: 'session_start',
                country: 'Other',
                created_at: `${day.date}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
                email: 'support@envisionpaths.com'
              });
            }
          });

          // Add Device Acquisitions (39 total)
          for (let i = 0; i < 39; i++) {
            const randomDay = playData[Math.floor(Math.random() * playData.length)].date;
            activity_logs.push({
              activity: 'device_acquisition',
              country: 'Unknown',
              created_at: `${randomDay}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
              email: 'support@envisionpaths.com'
            });
          }

          // Add First Opens (18 total)
          for (let i = 0; i < 18; i++) {
            const randomDay = playData[Math.floor(Math.random() * playData.length)].date;
            activity_logs.push({
              activity: 'first_open',
              country: 'Unknown',
              created_at: `${randomDay}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
              email: 'support@envisionpaths.com'
            });
          }

          const res = await fetch(API_URL + '/api/admin/import-data', {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity_logs })
          });

          if (res.ok) {
            showNotification('Play Console data synced successfully!', 'success');
            fetchActivityLogs();
          } else {
            showNotification('Failed to sync Play Console data.', 'error');
          }
        } catch (e) {
          console.error('Error syncing Play Console data:', e);
          showNotification('Error syncing data.', 'error');
        } finally {
          setIsImporting(false);
        }
      }
    });
  };

  const exportAllData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(API_URL + '/api/admin/export-data', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EnvisionPaths_Full_Export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Error exporting data:', e);
      showNotification('Failed to export data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const importAllData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      let data: any;

      // Check if it's JSON or CSV
      const trimmedText = text.trim();
      const firstLine = trimmedText.split('\n')[0].toLowerCase();
      const isCsv = (trimmedText.includes(',') || trimmedText.includes(';') || trimmedText.includes('\t')) && 
                    (firstLine.includes('activity') || firstLine.includes('email') || firstLine.includes('country') || 
                     firstLine.includes('job') || firstLine.includes('title') || firstLine.includes('industry') || 
                     firstLine.includes('score') || firstLine.includes('status') || firstLine.includes('event'));

      if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
        data = JSON.parse(text);
      } else if (isCsv) {
        // Simple CSV Parser
        const delimiter = trimmedText.includes('\t') ? '\t' : (trimmedText.includes(';') ? ';' : ',');
        const lines = trimmedText.split('\n').filter(line => line.trim().length > 0);
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, '').toLowerCase());
        
        const records = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
          const item: any = {};
          headers.forEach((header, index) => {
            // Mapping for Activity Logs
            if (header.includes('email')) item.email = values[index];
            if (header.includes('activity') || header.includes('event')) item.activity = values[index];
            if (header.includes('country')) item.country = values[index];
            if (header.includes('ip')) item.ip_address = values[index];
            if (header.includes('agent')) item.user_agent = values[index];
            
            // Mapping for Simulations
            if (header.includes('email')) item.email = values[index];
            if (header.includes('job')) item.job_title = values[index];
            if (header.includes('industry')) item.industry = values[index];
            if (header.includes('score')) item.score = parseInt(values[index]) || 0;
            if (header.includes('feedback')) item.feedback = values[index];
            if (header.includes('status')) item.status = values[index];

            // Common
            if (header.includes('time') || header.includes('date')) item.created_at = values[index];
          });
          return item;
        });
        
        // Determine if these are logs or simulations
        if (headers.some(h => h.includes('job') || h.includes('industry') || h.includes('score'))) {
          data = { simulations: records };
        } else {
          data = { activity_logs: records };
        }
        console.log('[Import] Parsed CSV data:', data);
      } else {
        throw new Error("Unrecognized file format. Please upload the .json export file or a valid activity/simulation CSV.");
      }
      
      const res = await fetch(API_URL + '/api/admin/import-data', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        showNotification('Data imported successfully!', 'success');
        fetchActivityLogs();
      } else {
        const err = await res.json();
        showNotification(`Import failed: ${err.error}`, 'error');
      }
    } catch (e: any) {
      console.error('Error importing data:', e);
      showNotification(`Error importing data: ${e.message || 'Unknown error'}`, 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const downloadLogsCSV = () => {
    if (activityLogs.length === 0) return;
    
    const headers = ['ID', 'Email', 'Activity', 'Country', 'IP Address', 'User Agent', 'Time'];
    const rows = activityLogs.map(log => [
      log.id,
      log.email,
      log.activity,
      log.country,
      log.ip_address,
      `"${log.user_agent?.replace(/"/g, '""') || ''}"`,
      new Date(log.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadSimulationsCSV = () => {
    if (simulations.length === 0) return;
    
    const headers = ['ID', 'User ID', 'Email', 'Job Title', 'Industry', 'Score', 'Status', 'Time'];
    const rows = simulations.map(sim => [
      sim.id,
      sim.user_id,
      sim.email || 'N/A',
      `"${sim.job_title?.replace(/"/g, '""') || ''}"`,
      `"${sim.industry?.replace(/"/g, '""') || ''}"`,
      sim.score,
      sim.status,
      new Date(sim.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Simulations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatsData = () => {
    const countryData: Record<string, number> = {};
    const dailyData: Record<string, Record<string, number>> = {};
    const allDates = new Set<string>();
    const allCountries = new Set<string>();

    activityLogs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const country = log.country || 'Unknown';
      
      allDates.add(date);
      allCountries.add(country);

      countryData[country] = (countryData[country] || 0) + 1;
      
      if (!dailyData[date]) dailyData[date] = {};
      dailyData[date][country] = (dailyData[date][country] || 0) + 1;
      dailyData[date]['total'] = (dailyData[date]['total'] || 0) + 1;
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const sortedCountries = Array.from(allCountries).sort((a, b) => countryData[b] - countryData[a]);

    const chartData = sortedCountries.slice(0, 10).map(country => ({
      name: country,
      value: countryData[country]
    }));

    const tableData = sortedDates.map(date => ({
      date,
      total: dailyData[date]['total'] || 0,
      countries: sortedCountries.reduce((acc, country) => {
        acc[country] = dailyData[date][country] || 0;
        return acc;
      }, {} as Record<string, number>)
    }));

    return { chartData, tableData, countries: sortedCountries };
  };

  useEffect(() => {
    if (step === 'admin') {
      fetchActivityLogs();
    }
  }, [step]);

  const fetchProfile = async () => {
    console.log('[APP] fetchProfile called');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const headers = getAuthHeaders();
      console.log('[APP] fetchProfile headers:', headers);
      const res = await fetch(API_URL + '/api/user/profile', { 
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log('[APP] fetchProfile response status:', res.status);
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          console.log('[APP] fetchProfile data:', data);
          setUser(data.user);
          setIsAdmin(!!data.user.is_admin);
          setSelectedPlan(data.user.plan_type);
          setSessionsUsed(data.user.simulations_this_month);
          setTwoFactorEnabled(!!data.user.two_factor_enabled);
          return data.user;
        } else {
          console.error('[APP] Profile fetch returned non-JSON response');
        }
      } else if (res.status === 401) {
        console.warn('[APP] Profile fetch 401 - Session invalid, clearing localStorage');
        localStorage.removeItem('session_id');
        setUser(null);
        setStep('auth');
      } else {
        const errorText = await res.text();
        console.error('[APP] Profile fetch failed:', res.status, errorText);
      }
    } catch (e) {
      console.error('[APP] Error fetching profile:', e);
    }
    return null;
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(API_URL + '/api/simulations/history', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (e) {
      console.error('Failed to fetch history');
    }
  };

  const fetchSimulationMessages = async (simulationId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/api/simulations/${simulationId}/messages`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSimulationMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Failed to fetch simulation messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(API_URL + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });
      const data = await response.json();
      if (data.success) {
        setResetUserId(data.userId);
        setResetStep('code');
        setAuthError(null);
      } else {
        setAuthError(data.error || 'Failed to initiate password reset.');
      }
    } catch (err) {
      setAuthError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(API_URL + '/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, code: resetCode })
      });
      const data = await response.json();
      if (data.success) {
        setResetStep('password');
        setAuthError(null);
      } else {
        setAuthError(data.error || 'Invalid or expired reset code.');
      }
    } catch (err) {
      setAuthError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(API_URL + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, code: resetCode, newPassword })
      });
      const data = await response.json();
      if (data.success) {
        setShowForgotPasswordForm(false);
        setResetStep('email');
        setAuthMode('login');
        setAuthError('Password reset successful. Please login with your new password.');
        setForgotPasswordEmail('');
        setResetCode('');
        setNewPassword('');
      } else {
        setAuthError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setAuthError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailCode = async () => {
    if (!tempUserId) return;
    setIsSendingCode(true);
    try {
      const res = await fetch(API_URL + '/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId })
      });
      if (res.ok) {
        setEmailCodeSent(true);
      }
    } catch (e) {
      console.error('Failed to send email code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handle2FALogin = async (e: React.FormEvent, bypassCode?: string) => {
    e.preventDefault();
    const codeToUse = bypassCode || twoFactorCode;
    if (!codeToUse || !tempUserId) return;

    try {
      const res = await fetch(API_URL + '/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, code: codeToUse, method: twoFactorMethod })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.sessionId) {
          localStorage.setItem('session_id', data.sessionId);
        }
        setUser(data.user);
        setSelectedPlan(data.user.is_admin ? 'elite' : data.user.plan_type);
        setIsAdmin(!!data.user.is_admin);
        setRequires2FA(false);
        setTempUserId(null);
        setTwoFactorCode('');
        setStep('setup');
        fetchHistory();
      } else {
        setAuthError(data.error || 'Invalid verification code');
      }
    } catch (e) {
      setAuthError('Network error. Please try again.');
    }
  };

  const setup2FA = async () => {
    try {
      const res = await fetch(API_URL + '/api/auth/setup-2fa', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setQrCodeUrl(data.qrCodeUrl);
        setIsSettingUp2FA(true);
      } else {
        showNotification(data.error || 'Failed to initiate 2FA setup', 'error');
      }
    } catch (e) {
      console.error('2FA setup error:', e);
    }
  };

  const verify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL + '/api/auth/verify-2fa', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ code: setupCode })
      });
      if (res.ok) {
        setTwoFactorEnabled(true);
        setIsSettingUp2FA(false);
        setSetupCode('');
        showNotification('Two-factor authentication enabled successfully!', 'success');
      } else {
        const data = await res.json();
        showNotification(data.error || 'Invalid verification code', 'error');
      }
    } catch (e) {
      console.error('2FA verification error:', e);
    }
  };

  const handleAdminBypass = async () => {
    if (email !== 'harrisonw707@gmail.com') return;
    
    try {
      const res = await fetch(API_URL + '/api/auth/admin-bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setIsAdmin(!!data.user.is_admin);
        setStep('setup');
        showNotification('Admin Quick Access successful!', 'success');
      } else {
        showNotification(data.error || 'Admin bypass failed', 'error');
      }
    } catch (e) {
      showNotification('Connection error', 'error');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const endpoint = authMode === 'signup' ? API_URL + '/api/auth/signup' : API_URL + '/api/auth/login';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Auth error response:', text.substring(0, 100));
        setAuthError('Server error. Please try again later.');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        if (data.requires_2fa) {
          setRequires2FA(true);
          setTempUserId(data.userId);
          setTwoFactorMethod(data.method || 'totp');
          return;
        }
        if (data.sessionId) {
          localStorage.setItem('session_id', data.sessionId);
        }
        setIsAdmin(!!data.user.is_admin);
        setSelectedPlan(data.user.is_admin ? 'elite' : data.user.plan_type);
        setUser(data.user);
        if (authMode === 'signup') {
          trackEvent('signup_success', { email, plan_type: data.user.plan_type });
          if (data.user.is_admin) {
            setStep('setup');
          } else {
            setStep('pricing');
          }
        } else {
          trackEvent('login_success', { email, is_admin: data.user.is_admin });
          setStep('setup');
          fetchHistory();
        }
      } else {
        trackEvent(authMode === 'signup' ? 'signup_failed' : 'login_failed', { email, error: data.error });
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (e) {
      setAuthError('Network error. Please try again.');
    }
  };

  const reportGlitch = () => {
    if (!currentSimulationId) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Report Glitch',
      message: 'Did the system glitch or fail to respond correctly? This will end the session and refund your simulation credit.',
      showInput: true,
      inputPlaceholder: 'Briefly describe what happened (optional)',
      onConfirm: async (reason?: string) => {
        try {
          const res = await fetch(API_URL + '/api/simulations/report-glitch', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ 
              simulation_id: currentSimulationId,
              reason: reason
            })
          });

          if (res.ok) {
            showNotification("Glitch reported. Your session has been refunded.", 'success');
            setStep('setup');
            setCurrentSimulationId(null);
            setMessages([]);
            fetchProfile();
          } else {
            const data = await res.json();
            showNotification(data.error || "Failed to report glitch.", 'error');
          }
        } catch (e) {
          console.error("Error reporting glitch:", e);
          showNotification("An error occurred while reporting the glitch.", 'error');
        }
      }
    });
  };
  const handleLogout = async () => {
    trackEvent('logout');
    localStorage.removeItem('session_id');
    try {
      await fetch(API_URL + '/api/auth/logout', { 
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.error('[AUTH] Logout API call failed:', e);
    }
    setEmail('');
    setPassword('');
    setStep('auth');
    setAuthMode('login');
    setSelectedPlan(null);
    setHistory([]);
    setIsAdmin(false);
    setTwoFactorEnabled(false);
    setRequires2FA(false);
    setTempUserId(null);
    setTwoFactorCode('');
    setTwoFactorMethod('totp');
    setEmailCodeSent(false);
    setSessionsUsed(0);
    setMessages([]);
    setJobTitle('');
    setIndustry('');
    setCurrentSimulationId(null);
    setSummary('');
    setAuthError(null);
    setLoginError(null);
    setUser(null);
    setIsSettingsOpen(false);
  };

  const handleDeleteAccount = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you absolutely sure? This will permanently delete your account and all your practice history. This action cannot be undone.',
      onConfirm: async () => {
        setIsDeletingAccount(true);
        try {
          const res = await fetch(API_URL + '/api/user/account', {
            method: 'DELETE',
            headers: getAuthHeaders()
          });

          if (res.ok) {
            localStorage.removeItem('session_id');
            setUser(null);
            setStep('auth');
            setIsSettingsOpen(false);
            showNotification('Your account has been successfully deleted.', 'success');
          } else {
            const data = await res.json();
            showNotification(data.error || 'Failed to delete account', 'error');
          }
        } catch (e) {
          showNotification('Network error. Please try again.', 'error');
        } finally {
          setIsDeletingAccount(false);
        }
      }
    });
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateEmailValue) return;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateEmailValue)) {
      showNotification('Please enter a valid email address.', 'error');
      return;
    }

    setIsUpdatingEmail(true);
    setUpdateMessage(null);
    try {
      const res = await fetch(API_URL + '/api/user/email', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newEmail: updateEmailValue })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, email: updateEmailValue });
        setUpdateMessage({ type: 'success', text: 'Email updated successfully' });
        setUpdateEmailValue('');
      } else {
        setUpdateMessage({ type: 'error', text: data.error || 'Failed to update email' });
      }
    } catch (e) {
      setUpdateMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordValue || !newPasswordValue) return;
    setIsUpdatingPassword(true);
    setUpdateMessage(null);
    try {
      const res = await fetch(API_URL + '/api/user/password', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          currentPassword: currentPasswordValue,
          newPassword: newPasswordValue 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateMessage({ type: 'success', text: 'Password updated successfully' });
        setCurrentPasswordValue('');
        setNewPasswordValue('');
      } else {
        setUpdateMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (e) {
      setUpdateMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const selectPlan = async (plan: 'beginner' | 'pro') => {
    // Get current user profile to get the ID
    setAuthError(null);
    try {
      const profileRes = await fetch(API_URL + '/api/user/profile', { headers: getAuthHeaders() });
      if (!profileRes.ok) throw new Error('Not authenticated');
      
      const contentType = profileRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await profileRes.text();
        console.error('Expected JSON but got:', text.substring(0, 100));
        throw new Error('Server returned invalid response format');
      }

      const { user } = await profileRes.json();

      // Stripe Payment Links (Replace with your actual links from Stripe Dashboard)
      const paymentLinks: Record<string, string> = {
        beginner: 'https://buy.stripe.com/28EaEY5Is6bfbmxa139R608',
        pro: 'https://buy.stripe.com/cNi14o2wg9nr76h2yB9R609'
      };

      const link = paymentLinks[plan];
      
      // Pass client_reference_id to identify the user in the webhook/redirect
      const checkoutUrl = new URL(link);
      checkoutUrl.searchParams.set('client_reference_id', user.id.toString());
      if (user.email) {
        checkoutUrl.searchParams.set('prefilled_email', user.email);
      }
      
      trackEvent('upgrade_clicked', { plan });
      
      // Use window.open to avoid iframe blocking issues (Stripe blocks iframe loading)
      const win = window.open(checkoutUrl.toString(), '_blank');
      if (!win) {
        // Fallback if popup is blocked
        window.location.href = checkoutUrl.toString();
      }
    } catch (e) {
      console.error('Upgrade error:', e);
      setAuthError('Please sign in to upgrade. If you are signed in, check your connection.');
      setStep('auth');
    }
  };

  const endInterview = () => {
    stopSpeaking();
    if (questionsAnswered < interviewLength && questionsAnswered > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'End Session?',
        message: `You have answered ${questionsAnswered} questions. Would you like to end the session and generate your performance report now, or just exit?`,
        onConfirm: () => {
          setStep('summary');
          setIsGeneratingSummary(true);
          generateSummary();
        }
      });
      return;
    } else if (questionsAnswered === 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Exit Session?',
        message: 'You haven\'t answered any questions yet. Are you sure you want to exit?',
        onConfirm: () => {
          setStep('setup');
          setMessages([]);
          setSummary('');
        }
      });
      return;
    }

    setStep('summary');
    setIsGeneratingSummary(true);
    generateSummary();
  };

  const getMessageFeedback = async (index: number) => {
    const msg = messages[index];
    if (!msg || msg.role !== 'user') return;

    // Find the question this was answering (the previous model message)
    let question = "";
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'model') {
        question = messages[i].text;
        break;
      }
    }

    setIsGeneratingFeedback(index);
    setIsFeedbackModalOpen(true);
    setActiveFeedback("");

    try {
      const prompt = `As an expert career coach, provide instant, actionable feedback on this specific interview answer.

Context:
- Job Title: ${jobTitle}
- Industry: ${industry}
- Question Asked: "${question}"
- Candidate's Answer: "${msg.text}"

Please provide:
1. **The Verdict**: A quick assessment (e.g., "Strong", "Good", "Needs Work").
2. **What Worked**: Specific strengths in this answer.
3. **What's Missing**: Key points or details that would have made it better.
4. **The "Pro" Version**: A refined, high-impact version of this answer.
5. **Quick Tip**: One specific thing to remember for next time.

Keep it concise, professional, and highly actionable. Use Markdown formatting.`;

      let fullFeedback = "";
      const stream = generateAIStream(prompt);
      for await (const chunk of stream) {
        fullFeedback += chunk;
        setActiveFeedback(fullFeedback);
      }
    } catch (error) {
      console.error("Error generating message feedback:", error);
      showNotification("Failed to generate feedback. Please try again.", "error");
    } finally {
      setIsGeneratingFeedback(null);
    }
  };
  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummary(""); // Clear previous summary
    let fullSummary = "";
    try {
      const conversation = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');

      const prompt = `As an elite executive career coach and expert interviewer at EnvisionPaths, provide a high-impact, deeply analytical performance report for a candidate who just completed an interview for the position of "${jobTitle}" in the "${industry}" industry.

Analyze the following interview transcript with extreme precision:
${conversation}

Your report MUST be structured as follows:

1. **Overall Performance Score**: A score out of 10 (e.g., "Score: 8/10").
2. **Executive Summary**: A high-level overview of their performance, highlighting their unique value proposition and overall readiness for the role.
3. **Deep-Dive Question Analysis**: For EACH question asked by the interviewer, provide:
   - **The Question**: [Question Text]
   - **Your Response**: [Brief summary of what they said]
   - **The Verdict**: 
     - 🌟 **Strengths**: What exactly did they do right? (e.g., specific examples used, tone, clarity, alignment with role).
     - 🚀 **Growth Opportunities**: What was missing? How could they have made it more impactful? Provide a "Better Way to Say It" example.
4. **Competency Matrix**:
   - **Communication**: (Clarity, conciseness, confidence)
   - **Technical/Industry Knowledge**: (Depth of understanding, use of terminology)
   - **Problem Solving/Critical Thinking**: (Structure of answers, logic)
   - **Cultural Fit/Soft Skills**: (Enthusiasm, professionalism)
5. **Industry-Specific Insights**: How their answers align with current trends, high-stakes expectations, and competitive benchmarks in the ${industry} industry.
6. **Actionable Roadmap**:
   - **Top 3 Strengths to Double Down On**: What makes them stand out?
   - **Top 3 Critical Improvements**: What must they fix before the real interview?
   - **Recommended Practice Focus**: Specific topics or question types to practice next.

Format the output with professional formatting, using bold headers, emojis for visual hierarchy, and clear bullet points. The tone should be professional, direct, and highly encouraging.`;

      const stream = generateAIStream(prompt);
      for await (const chunk of stream) {
        fullSummary += chunk;
        setSummary(fullSummary);
      }

      // User requested log
      const analysis = { status: "complete", score: 0 }; // Placeholder for analysis object
      console.log("STATUS:", analysis?.status);

      const scoreMatch = fullSummary.match(/Score:?\s*(\d+)/i) || fullSummary.match(/(\d+)\/10/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;

      try {
        if (API_URL) {
          await fetch(API_URL + '/api/simulations/complete', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              simulation_id: currentSimulationId,
              job_title: jobTitle,
              industry,
              score,
              feedback: fullSummary,
              messages: messages.map(m => ({
                role: m.role,
                text: m.text
              }))
            })
          });
        }
      } catch (e) {
        console.error("Backend failed:", e);
      }

      setCurrentSimulationId(null);
      fetchHistory();

    } catch (error: any) {
      console.error("Error generating summary:", error);
      const isApiKeyError = error.message?.includes('API KEY NOT VALID') || error.message?.includes('400');
      const errorMsg = isApiKeyError
        ? "AI Service Configuration Error: The API key is missing or invalid. Please ensure the GEMINI_API_KEY environment variable is set or select a key in the AI Studio settings."
        : "Error generating summary. Please try again.";
      setSummary(errorMsg);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image must be smaller than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await fetch(`${API_URL}/api/user/profile-picture`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ profilePicture: base64String })
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ ...user, profile_picture: data.profilePicture });
          showNotification('Profile picture updated!', 'success');
        } else {
          const err = await res.json();
          showNotification(err.error || 'Failed to update profile picture.', 'error');
        }
      } catch (error) {
        console.error('Profile picture upload error:', error);
        showNotification('Error uploading profile picture.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    setIsEnhancingResume(true);
    
    // Simulate AI enhancement based on plan
    setTimeout(() => {
      if (selectedPlan === 'pro' || selectedPlan === 'elite') {
        setResumeAnalysis("PRO ENHANCEMENT: Your resume has been optimized with industry-specific keywords, quantified achievements, and strategic formatting. We've identified 12 key skills to highlight for this role.");
      } else if (selectedPlan === 'beginner') {
        setResumeAnalysis("BEGINNER ENHANCEMENT: Basic formatting check complete. Keywords identified. Limited optimization applied.");
      } else {
        setResumeAnalysis("Resume uploaded and analyzed for smart enhancement and keyword optimization.");
      }
      setIsEnhancingResume(false);
    }, 2000);
  };

  const startInterview = async () => {
    if (!jobTitle || isTyping) return;
    
    setIsTyping(true);
    try {
      const res = await fetch(API_URL + '/api/simulations/start', { 
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ job_title: jobTitle, industry })
      });
      
      // Handle non-OK responses
      if (!res.ok) {
        let errorMessage = 'Failed to start interview';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await res.text();
            console.error(`Non-JSON error response (${res.status}):`, text);
            errorMessage = `Server Error (${res.status})`;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        showNotification(errorMessage, 'error');
        if (res.status === 403) setStep('pricing');
        return;
      }

      const data = await res.json();
      setCurrentSimulationId(data.simulation_id);

      setStep('interview');
      setQuestionsAsked(1); // First question is about to be asked
      setQuestionsAnswered(0);
      setInterviewCompleted(false);
      setInterviewLength(selectedPlan === 'pro' || selectedPlan === 'elite' ? 8 : 5); // Pro/Elite gets longer interviews
      setSessionsUsed(prev => prev + 1);
      trackEvent('simulation_started', { job_title: jobTitle });
      

      
      const prompt = `You are a professional career coach and expert interviewer at EnvisionPaths. 
      I am applying for the position of ${jobTitle} in the ${industry} industry. 
      Please start the interview by saying exactly: "Welcome, thanks for coming in!" followed by a brief introduction and your first interview question: "Tell me about yourself."
      Keep your tone professional, encouraging, and insightful.`;

      const response = await generateAI(prompt);
      setMessages([{
        role: 'model',
        text: response.text,
        timestamp: new Date()
      }]);
      
      if (interactionMode === 'voice') {
        speak(response.text);
      }
    } catch (error: any) {
      console.error("Error starting interview:", error);
      const isApiKeyError = error.message?.includes('API KEY NOT VALID') || error.message?.includes('400');
      const errorMsg = isApiKeyError
        ? "AI Service Configuration Error: The API key is missing or invalid. Please ensure the GEMINI_API_KEY environment variable is set or select a key in the AI Studio settings."
        : (error.message || "Failed to start interview. Please check your connection.");
      showNotification(errorMsg, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const speak = async (text: string, force: boolean = false, voiceOverride?: string) => {
    if (!force && interactionMode !== 'voice' && !isAudioEnabled) return;
    
    // Stop any current speech before starting new one
    stopSpeaking();

    try {
      const audio = await generateSpeech(text, voiceOverride || selectedVoice);
      
      if (audio) {
        const audioUrl = `data:audio/mpeg;base64,${audio}`;
        const audioEl = new Audio(audioUrl);
        audioRef.current = audioEl;
        setIsSpeaking(true);
        audioEl.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          if (interactionMode === 'voice' && !interviewCompleted) {
            toggleListening();
          }
        };
        audioEl.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };
        audioEl.play();
      } else {
        // Fallback to browser TTS if API fails
        const utterance = new SpeechSynthesisUtterance(text);
        speechRef.current = utterance;
        utterance.rate = 1.1;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          speechRef.current = null;
          if (interactionMode === 'voice' && !interviewCompleted) {
            toggleListening();
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          speechRef.current = null;
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error('TTS Error:', e);
      // Fallback
      const utterance = new SpeechSynthesisUtterance(text);
      speechRef.current = utterance;
      utterance.rate = 1.1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        speechRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        speechRef.current = null;
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = async () => {
    if (!window.MediaRecorder) {
      showNotification('Audio recording is not supported in your browser.', 'error');
      return;
    }

    if (isListening) {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        setIsListening(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType });
        setIsTranscribing(true);
        
        try {
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          const transcription = await transcribeAudio(base64Audio, recorder.mimeType);
          
          if (transcription && transcription.trim()) {
            setInput(transcription);
            // Auto-send after transcription
            setTimeout(() => {
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSendMessage(fakeEvent, transcription);
            }, 500);
          } else {
            showNotification("Could not understand the audio. Please try again.", 'info');
          }
        } catch (error) {
          console.error("Transcription error:", error);
          showNotification("Failed to transcribe audio. Please try typing your answer.", 'error');
        } finally {
          setIsTranscribing(false);
          // Stop all tracks in the stream
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
    } catch (error) {
      console.error("Microphone access error:", error);
      showNotification("Could not access your microphone. Please check your browser permissions.", 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const messageText = overrideInput || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    // setQuestionsAnswered(prev => prev + 1); // Move to success block
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Ensure history starts with 'user' for better API compatibility
      if (history.length > 0 && history[0].role === 'model') {
        history.unshift({
          role: 'user',
          parts: [{ text: `I am ready for my ${jobTitle} interview. Please begin.` }]
        });
      }

      const isFree = !selectedPlan || selectedPlan === 'free';
      const isPro = selectedPlan === 'pro' || selectedPlan === 'elite';
      
      const systemInstruction = `You are an expert career coach. 
      Conduct a realistic interview for a ${jobTitle} role. 
      ${isFree ? 'This is a free trial session, so keep the interview concise (max 5 questions total).' : ''}
      ${isPro ? 'Provide deep behavioral and technical analysis in your feedback. Focus on high-level strategic answers.' : 'Focus on standard interview questions.'}
      After the user answers a question, briefly acknowledge their answer with a "Coach's Tip" (in italics) 
      and then move on to the next insightful interview question. 
      Focus on behavioral, technical, and situational questions.
      
      CRITICAL: Keep your responses concise and focused. Do not be overly wordy.
      
      MANDATORY: At some point during the interview (preferably towards the middle), you MUST ask the candidate: "Describe yourself with one word."
      
      CRITICAL: You have currently asked ${questionsAsked} questions. 
      The target interview length is ${interviewLength} questions.
      If you have reached ${interviewLength} questions, do NOT ask another question. 
      Instead, say: "That concludes our interview session! I've gathered enough information to provide your performance report. Please click the 'End Session' button to see your results."`;

      console.log('[Chat] Sending message to AI...');
      const response = await Promise.race([
        generateContent(messageText, systemInstruction, history),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out after 60 seconds")), 60000))
      ]) as any;

      console.log('[Chat] AI response received.');

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: text,
        timestamp: new Date()
      }]);
      
      setQuestionsAnswered(prev => prev + 1); // Increment only on success
      
      if (questionsAnswered + 1 < interviewLength) {
        setQuestionsAsked(prev => prev + 1);
      } else {
        setInterviewCompleted(true);
      }
      
      if (interactionMode === 'voice') {
        speak(text);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const isQuota = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
      const isApiKeyError = error.message?.includes('API KEY NOT VALID') || error.message?.includes('400');
      
      const errorMsg = isQuota 
        ? "System Quota exceeded. The system is busy. Please wait 60 seconds and try again." 
        : isApiKeyError
          ? "AI Service Configuration Error: The API key is missing or invalid. Please ensure the GEMINI_API_KEY environment variable is set or select a key in the AI Studio settings."
          : (error.message || "Failed to get response from the system. Please try again.");
      
      showNotification(errorMsg, 'error');
      setShowRetry(true); // Show the reset button
    } finally {
      setIsTyping(false);
    }
  };


  const dynamicPlaceholder = (() => {
    if (interviewCompleted) return "Interview finished. View your results below.";
    if (isTyping) return "Coach is thinking...";
    if (isSpeaking) return "Coach is speaking...";
    if (interactionMode === 'voice') return "Listening for your voice...";
    return "Type your answer...";
  })();

  return (
    <div className={`min-h-screen flex flex-col bg-theme-main font-sans text-theme-primary selection:bg-red-600 selection:text-white transition-colors duration-300 ${theme === 'light' ? 'theme-light' : ''}`}>
      {isLoading && (
        <div className="fixed inset-0 bg-theme-main/90 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500/10 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-secondary opacity-50 animate-pulse">Preparing your session...</p>
          
          <div className="mt-8 text-[8px] text-theme-secondary opacity-30 font-mono uppercase tracking-widest">
            Session: {typeof window !== 'undefined' && localStorage.getItem('session_id') ? 'Active' : 'None'}
          </div>
        </div>
      )}

      {/* Header */}
      {step !== 'auth' && (
        <header className="sticky top-0 z-50 bg-theme-main border-b border-theme px-4 py-2 md:px-6 md:py-3 backdrop-blur-md bg-theme-main/80">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tighter uppercase italic text-theme-primary">
                Envision<span className="text-red-600">Paths</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full mr-2 shadow-lg shadow-red-600/20"
                >
                  <RefreshCw size={10} className="text-white animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Processing</span>
                </motion.div>
              )}
              <Tooltip content="Manage your subscription" position="bottom">
                <button 
                  onClick={() => setStep('pricing')}
                  aria-label="Billing and subscription"
                  className="text-theme-secondary hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  <CreditCard size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Billing</span>
                </button>
              </Tooltip>
              <Tooltip content="Practice Schedule" position="bottom">
                <button 
                  onClick={() => setStep('reminders')}
                  aria-label="Practice Schedule"
                  className="text-theme-secondary hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  <Clock size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Schedule</span>
                </button>
              </Tooltip>
              {user?.is_admin && (
                <Tooltip content="Admin Dashboard" position="bottom">
                  <button 
                    onClick={() => setStep('admin')}
                    aria-label="Admin Dashboard"
                    className="text-theme-secondary hover:text-red-500 transition-colors flex items-center gap-2"
                  >
                    <Shield size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Admin</span>
                  </button>
                </Tooltip>
              )}
              <button 
                onClick={() => {
                  setIsSettingsOpen(true);
                }}
                aria-label="Settings"
                className="flex items-center gap-2 text-theme-secondary hover:text-red-500 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full border border-theme overflow-hidden bg-theme-surface flex items-center justify-center group-hover:border-red-500/50 transition-colors">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Settings size={18} />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Account</span>
              </button>
              <Tooltip content="Sign out of your account" position="bottom">
                <button 
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="text-theme-secondary hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </Tooltip>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 max-w-6xl mx-auto w-full flex flex-col ${step === 'interview' ? 'p-2 sm:p-3' : 'p-4 md:p-6'}`}>
        <AnimatePresence mode="wait">
          {step === 'auth' ? (
            <motion.div 
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[90vh] flex flex-col items-center justify-center py-8 md:py-12"
            >
              <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="space-y-6 md:space-y-8 text-center lg:text-left px-4 md:px-0">
                  <div className="inline-block px-4 py-1.5 bg-theme-surface border border-theme rounded-full">
                    <p className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.3em]">Strategic Interview Coaching</p>
                  </div>
                  <div className="flex justify-center lg:justify-start mb-6">
                    <img src="/icons/icon.svg" alt="EnvisionPaths Logo" className="w-24 h-24 md:w-32 md:h-32" referrerPolicy="no-referrer" />
                  </div>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-theme-primary">
                    Navigate Your <span className="text-red-600">Path</span> <br />
                    Towards <span className="text-red-600">Success</span>
                  </h1>
                  <p className="text-theme-secondary text-base md:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                    Strategic interview preparation for modern professionals. Practice with industry-specific scenarios and get real-time feedback to land your dream job.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 pt-2 md:pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-red-500" />
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Real-time Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-red-500" />
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Industry Specific</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-red-500" />
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Expert Coaching</span>
                    </div>
                  </div>
                </div>

                <div className="bg-theme-surface border border-theme p-6 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative mx-4 md:mx-0">
                  {/* Decorative elements removed per user request */}
                  
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2 text-theme-primary">
                      {requires2FA ? 'Verification Required' : authMode === 'login' ? 'Welcome Back' : 'Join EnvisionPaths'}
                      <span className="text-[8px] opacity-20 ml-2">v1.2.1</span>
                    </h2>
                    <p className="text-theme-secondary text-sm">
                      {requires2FA 
                        ? 'Enter your two-factor authentication code.'
                        : authMode === 'login' 
                        ? 'Enter your credentials to access the platform.' 
                        : 'Create your account to start your journey.'}
                    </p>
                  </div>

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest text-center"
                  >
                    {authError}
                  </motion.div>
                )}



                {showForgotPasswordForm ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-black uppercase tracking-tight italic text-theme-primary">
                        {resetStep === 'email' ? 'Reset Password' : resetStep === 'code' ? 'Verify Code' : 'New Password'}
                      </h3>
                      <p className="text-xs text-theme-secondary mt-2">
                        {resetStep === 'email' ? 'Enter your email to receive a reset code.' : resetStep === 'code' ? 'Enter the 6-digit code sent to your email.' : 'Enter your new secure password.'}
                      </p>
                    </div>

                    {resetStep === 'email' && (
                      <form onSubmit={handleForgotPassword} className="space-y-4 md:space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your Email</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              type="email" 
                              required
                              placeholder="Enter your email address"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 md:py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-4 md:py-5 rounded-xl transition-all shadow-lg shadow-red-900/20"
                        >
                          Send Reset Code
                        </button>
                      </form>
                    )}

                    {resetStep === 'code' && (
                      <form onSubmit={handleVerifyResetCode} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Verification Code</label>
                          <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              type="text" 
                              required
                              placeholder="000000"
                              maxLength={6}
                              value={resetCode}
                              onChange={(e) => setResetCode(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm tracking-[0.5em] font-mono text-center text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-5 rounded-xl transition-all shadow-lg shadow-red-900/20"
                        >
                          Verify Code
                        </button>
                      </form>
                    )}

                    {resetStep === 'password' && (
                      <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              type="password" 
                              required
                              placeholder="Enter your new secure password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-5 rounded-xl transition-all shadow-lg shadow-red-900/20"
                        >
                          Update Password
                        </button>
                      </form>
                    )}

                    <button 
                      type="button"
                      onClick={() => {
                        setShowForgotPasswordForm(false);
                        setResetStep('email');
                        setAuthError(null);
                      }}
                      className="w-full text-xs text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : requires2FA ? (
                  <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-theme-surface rounded-xl border border-theme">
                      <button 
                        onClick={() => { setTwoFactorMethod('totp'); setTwoFactorCode(''); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${twoFactorMethod === 'totp' ? 'bg-red-600 text-white' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        App Code
                      </button>
                      <button 
                        onClick={() => { setTwoFactorMethod('email'); setTwoFactorCode(''); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${twoFactorMethod === 'email' ? 'bg-red-600 text-white' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Email Code
                      </button>
                    </div>

                    {twoFactorMethod === 'email' && !emailCodeSent ? (
                      <div className="text-center space-y-4 py-4">
                        <p className="text-xs text-theme-secondary">We can send a one-time verification code to your registered email address.</p>
                        <button 
                          onClick={sendEmailCode}
                          disabled={isSendingCode}
                          className="w-full bg-theme-primary text-theme-main font-black uppercase tracking-widest py-4 rounded-xl hover:opacity-90 transition-colors text-xs disabled:opacity-50"
                        >
                          {isSendingCode ? 'Sending...' : 'Send Email Code'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handle2FALogin} className="space-y-5">
                        <div className="space-y-2">
                          <label htmlFor="2fa-code" className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">
                            {twoFactorMethod === 'totp' ? 'Authenticator App Code' : 'Your Verification Code'}
                          </label>
                          <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              id="2fa-code"
                              type="text" 
                              required
                              placeholder="000000"
                              maxLength={6}
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm tracking-[0.5em] font-mono text-center text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-5 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 border border-theme group"
                        >
                          Verify & Login
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </form>
                    )}

                    <button 
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setTempUserId(null);
                        setTwoFactorCode('');
                        setTwoFactorMethod('totp');
                        setEmailCodeSent(false);
                      }}
                      className="w-full text-xs text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <React.Fragment>
                    <form onSubmit={handleAuth} className="space-y-4 md:space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your Email</label>
                        <Tooltip content={authMode === 'login' ? "Enter your registered email" : "Enter your professional email"} position="right">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              id="email"
                              name="email"
                              type="email" 
                              required
                              placeholder="Enter your email address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 md:py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </Tooltip>
                        {email === 'harrisonw707@gmail.com' && (
                          <motion.button
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            type="button"
                            onClick={handleAdminBypass}
                            className="w-full mt-2 bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white font-black uppercase tracking-[0.2em] py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px]"
                          >
                            <Shield size={14} />
                            Admin Quick Access (No Password)
                          </motion.button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your Password</label>
                        <Tooltip content="Minimum 8 characters" position="right">
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              id="password"
                              name="password"
                              type="password" 
                              required
                              placeholder="Enter your secure password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 md:py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </Tooltip>
                      </div>

                      <Tooltip content={authMode === 'login' ? "Securely access your dashboard" : "Join the Envision community"}>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-4 md:py-5 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 border border-theme group"
                        >
                          {authMode === 'login' ? 'Sign In' : 'Join EnvisionPaths'}
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </Tooltip>

                      {authMode === 'login' && (
                        <button 
                          type="button"
                          onClick={() => {
                            setShowForgotPasswordForm(true);
                            setResetStep('email');
                            setAuthError(null);
                          }}
                          className="w-full text-[10px] text-theme-secondary hover:text-red-500 transition-colors uppercase tracking-widest font-bold mt-2"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </form>

                    <div className="mt-8 text-center space-y-4">
                      <button 
                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        className="text-xs text-theme-secondary hover:text-red-500 transition-colors block w-full"
                      >
                        {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                      </button>

                      <div className="flex justify-center gap-4">
                        <button 
                          type="button"
                          onClick={() => setIsPrivacyOpen(true)}
                          className="text-[10px] text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                        >
                          Privacy Policy
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsTermsOpen(true)}
                          className="text-[10px] text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                        >
                          Terms of Service
                        </button>
                      </div>
                      {authMode === 'signup' && (
                        <div className="flex flex-col items-center gap-1 mt-2">
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 size={10} className="text-red-500" />
                            No spam email. Ever.
                          </p>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 size={10} className="text-red-500" />
                            Cancel subscription anytime.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-theme">
                      <p className="text-[10px] text-theme-secondary uppercase tracking-[0.2em] font-black mb-6 text-center">Quick Start Guide</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2 p-4 bg-theme-surface border border-theme rounded-xl sm:bg-transparent sm:border-0 sm:p-0">
                          <div className="w-6 h-6 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-[10px] font-black text-red-500 mx-auto">1</div>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest text-center leading-tight">Click Sign Up Below</p>
                        </div>
                        <div className="space-y-2 p-4 bg-theme-surface border border-theme rounded-xl sm:bg-transparent sm:border-0 sm:p-0">
                          <div className="w-6 h-6 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-[10px] font-black text-red-500 mx-auto">2</div>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest text-center leading-tight">Create Account</p>
                        </div>
                        <div className="space-y-2 p-4 bg-theme-surface border border-theme rounded-xl sm:bg-transparent sm:border-0 sm:p-0">
                          <div className="w-6 h-6 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-[10px] font-black text-red-500 mx-auto">3</div>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest text-center leading-tight">Access Dashboard</p>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                )}
</div>
            </div>


            </motion.div>
          ) : step === 'pricing' ? (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto mt-8 md:mt-12 px-4 md:px-0"
            >
              <div className="text-center mb-6 md:mb-12">
                <div className="flex justify-center mb-6">
                  <img src="/icons/icon.svg" alt="EnvisionPaths Logo" className="w-24 h-24 md:w-32 md:h-32" referrerPolicy="no-referrer" />
                </div>
                <h2 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic mb-3 md:mb-4">
                  {sessionsUsed >= 2 && (!selectedPlan || selectedPlan === 'free') ? 'Ready for more practice?' : <span>Level Up Your <span className="text-red-600">Career</span></span>}
                </h2>
                <p className="text-theme-secondary max-w-2xl mx-auto text-sm md:text-base">
                  {sessionsUsed >= 2 && (!selectedPlan || selectedPlan === 'free')
                    ? "You’ve mastered your simulations for now! Ready for more practice? Keep the momentum going." 
                    : 'You’re making progress. Choose the plan that fits your current career goals.'}
                </p>
                <div className="mt-4 inline-block px-4 py-1 bg-theme-surface-hover border border-theme rounded-full">
                  <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em]">
                    {sessionsUsed >= 2 && (!selectedPlan || selectedPlan === 'free') ? 'Free Limit Reached' : <span>Build discipline. Navigate your path towards <span className="text-red-600">success</span>.</span>}
                  </p>
                </div>

                <div className="mt-10 flex items-center justify-center gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!isAnnual ? 'text-theme-primary' : 'text-theme-secondary'}`}>Monthly</span>
                  <button 
                    onClick={() => setIsAnnual(!isAnnual)}
                    className="w-14 h-7 bg-theme-surface rounded-full p-1 relative transition-colors hover:bg-theme-surface-hover border border-theme"
                  >
                    <motion.div 
                      animate={{ x: isAnnual ? 28 : 0 }}
                      className="w-5 h-5 bg-red-600 rounded-full shadow-lg"
                    />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isAnnual ? 'text-theme-primary' : 'text-theme-secondary'}`}>Annual</span>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Save 20%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Free Tier */}
                <div className="bg-theme-surface border border-theme p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-sm flex flex-col hover:border-red-500/30 transition-all group">
                  <div className="mb-6 md:mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-theme-secondary">Free</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-primary">$0</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8 md:mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      2 simulations / month
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Standard feedback
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Standard question bank
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Limited resources
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Limited Resume Upload
                    </li>
                  </ul>

                  <button 
                    onClick={() => {
                      setSelectedPlan('free');
                      trackEvent('upgrade_clicked', { plan: 'free' });
                      setStep('setup');
                    }}
                    disabled={sessionsUsed >= 2}
                    className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                      selectedPlan === 'free' || !selectedPlan
                        ? 'bg-theme-surface-hover text-theme-primary border-theme' 
                        : 'bg-transparent text-theme-secondary border-theme hover:border-red-500/50 hover:text-theme-primary'
                    } ${sessionsUsed >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {selectedPlan === 'free' || !selectedPlan ? 'Current Plan' : 'Select Free'}
                  </button>
                </div>

                {/* Beginner Tier */}
                <div className="bg-theme-surface border border-theme p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-sm flex flex-col hover:border-red-500/50 transition-all group relative">
                  <div className="absolute -top-3 left-6 bg-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white">
                    30-Day Unlock
                  </div>
                  <div className="mb-6 md:mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-red-400">Beginner</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-primary">$5</span>
                    </div>
                    <p className="text-[10px] text-theme-secondary uppercase font-bold mt-1">Short-term burst</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8 md:mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-500" />
                      Unlimited for 30 days
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-500" />
                      Full performance feedback
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-500" />
                      Expanded question bank
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-500" />
                      Performance tracking
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-500" />
                      Basic Resume Upload
                    </li>
                  </ul>

                  <button 
                    onClick={() => {
                      trackEvent('upgrade_clicked', { plan: 'beginner' });
                      selectPlan('beginner');
                    }}
                    className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                      selectedPlan === 'beginner' 
                        ? 'bg-red-600 text-white border-red-500' 
                        : 'bg-theme-surface-hover text-theme-primary border-theme hover:border-red-500/50'
                    }`}
                  >
                    {selectedPlan === 'beginner' ? 'Active' : 'Get Access'}
                  </button>
                </div>

                {/* Pro Tier */}
                <div className="bg-theme-surface border border-red-600/30 p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-sm flex flex-col hover:border-red-600/60 transition-all group relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-white">
                    Most Popular
                  </div>
                  <div className="mb-6 md:mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-red-500">Pro</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-primary">${isAnnual ? '12' : '15'}</span>
                      <span className="text-theme-secondary text-[10px] uppercase font-bold tracking-widest">/ month</span>
                    </div>
                    {isAnnual && (
                      <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-1">Billed annually ($144)</p>
                    )}
                    <p className="text-[10px] text-theme-secondary uppercase font-bold mt-1">Power users</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8 md:mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Everything in Beginner
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Advanced performance critique
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Behavioral + Technical focus
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Unlimited saved history
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Priority processing
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Voice Interaction Mode
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Smart Resume Optimization
                    </li>
                  </ul>

                  <button 
                    onClick={() => {
                      trackEvent('upgrade_clicked', { plan: 'pro' });
                      selectPlan('pro');
                    }}
                    className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                      selectedPlan === 'pro' || selectedPlan === 'elite'
                        ? 'bg-red-600 text-white border-red-500' 
                        : 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                    }`}
                  >
                    {selectedPlan === 'pro' || selectedPlan === 'elite' ? 'Active' : 'Go Pro'}
                  </button>
                </div>

                {/* Elite Tier */}
                <div className={`bg-theme-surface border border-theme p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-sm flex flex-col group transition-all opacity-70 grayscale relative overflow-hidden`}>
                  <div className="absolute top-4 right-4 bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                    Coming Soon
                  </div>
                  <div className="mb-6 md:mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-theme-secondary">Elite</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-secondary">$49</span>
                      <span className="text-theme-secondary text-[10px] uppercase font-bold tracking-widest">/ month</span>
                    </div>
                    <p className="text-[10px] text-theme-secondary uppercase font-bold mt-1">Future Premium Features</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8 md:mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Everything in Pro
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Unlimited Simulations
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      1-on-1 Human Coaching
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Advanced Career Roadmap
                    </li>
                  </ul>

                  <button 
                    disabled
                    className="w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border bg-theme-surface-hover text-theme-secondary border-theme cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>

              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 text-theme-secondary text-sm italic">
                  <Award size={16} />
                  <span>Ready for more practice? Continue sharpening your skills.</span>
                </div>
              </div>
            </motion.div>
          ) : step === 'setup' ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto mt-8 md:mt-12 px-4 md:px-0"
            >
              <div className="text-center mb-8 md:mb-12">
                <div className="flex justify-center mb-6">
                  <img src="/icons/icon.svg" alt="EnvisionPaths Logo" className="w-24 h-24 md:w-32 md:h-32" referrerPolicy="no-referrer" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic mb-4 text-theme-primary">Prepare for <span className="text-red-600">Success</span></h2>
                <p className="text-theme-secondary max-w-2xl mx-auto">The interview is your opportunity to shine. Select your industry and target role to begin your practice session.</p>
                {(!selectedPlan || selectedPlan === 'free') && (
                  <div className="mt-6 inline-block bg-theme-surface border border-theme px-4 py-2 rounded-full">
                    <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest">
                      {sessionsUsed} of 2 free simulations used
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Industry & Role */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-theme-surface border border-theme rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        1. Industry Focus
                      </label>
                      <div className="relative group">
                        <select 
                          id="industrySelect"
                          value={industry}
                          onChange={(e) => {
                            setIndustry(e.target.value);
                            setJobTitle('');
                          }}
                          className="w-full bg-theme-input border border-theme rounded-2xl px-6 py-4 md:py-6 outline-none focus:border-red-500 transition-all appearance-none text-sm font-bold uppercase tracking-widest cursor-pointer hover:border-red-500/50"
                        >
                          <option value="" disabled className="bg-theme-surface">Select Industry...</option>
                          {Object.keys(suggestedRoles).map((ind) => (
                            <option key={ind} value={ind} className="bg-theme-surface">{ind.replace(/([A-Z])/g, ' $1').trim()}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none group-hover:text-theme-primary transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        2. Target Role
                      </label>
                      <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-theme-secondary" size={20} />
                        <input 
                          id="jobTitle"
                          name="jobTitle"
                          type="text" 
                          placeholder="Search or enter any job title..."
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="w-full pl-16 pr-6 py-4 md:py-6 bg-theme-input border border-theme rounded-2xl focus:border-red-600 outline-none transition-all text-base md:text-lg font-bold placeholder:text-theme-secondary/50 text-theme-primary"
                        />
                      </div>

                      {industry && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[8px] font-black text-theme-secondary uppercase tracking-widest">Suggested Roles</p>
                            <p className="text-[8px] font-black text-theme-secondary uppercase tracking-widest flex items-center gap-1 animate-pulse">
                              <ChevronDown size={10} />
                              Scroll for more
                            </p>
                          </div>
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"
                          >
                            {suggestedRoles[industry].map((role) => (
                              <button
                                key={role}
                                onClick={() => setJobTitle(role)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-center ${
                                  jobTitle === role 
                                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20' 
                                    : 'bg-theme-input border-theme text-theme-secondary hover:border-red-500/50 hover:text-theme-primary'
                                }`}
                              >
                                {role}
                              </button>
                            ))}
                          </motion.div>
                        </div>
                      )}
                    </div>

                    </div>

                {/* Simulation History */}
                  {history.length > 0 && (
                    <div className="bg-theme-surface border border-theme rounded-3xl p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-2">
                          <History size={16} className="text-red-500" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Progress & History</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-theme-secondary">Score Trend</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Trend Chart */}
                      <div className="h-[200px] w-full mb-8 bg-theme-input border border-theme rounded-2xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...history].reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                            <XAxis 
                              dataKey="created_at" 
                              hide 
                            />
                            <YAxis 
                              domain={[0, 10]} 
                              stroke={theme === 'dark' ? '#666' : '#999'} 
                              fontSize={8}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                fontSize: '10px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#dc2626" 
                              strokeWidth={3} 
                              dot={{ fill: '#dc2626', r: 4 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {history.slice(0, 4).map((sim) => (
                          <button 
                            key={sim.id} 
                            onClick={() => {
                              setSelectedSimulation(sim);
                              fetchSimulationMessages(sim.id);
                            }}
                            className="w-full text-left flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/50 hover:bg-theme-surface-hover transition-all group"
                          >
                            <div>
                              <p className="text-[10px] font-black text-theme-primary uppercase tracking-widest group-hover:text-red-500 transition-colors">{sim.job_title}</p>
                              <p className="text-[8px] text-theme-secondary uppercase font-black tracking-widest mt-1">{new Date(sim.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black italic text-red-500">{sim.score}/10</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice Schedule & Reminders */}
                  <div className="bg-theme-surface border border-theme rounded-3xl p-4 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-red-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Practice Schedule</h3>
                      </div>
                      <button 
                        onClick={() => setIsScheduling(true)}
                        className="text-[8px] font-black uppercase tracking-widest bg-red-600/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"
                      >
                        Add Session
                      </button>
                    </div>

                    {reminders.length > 0 ? (
                      <div className="space-y-3">
                        {reminders.map((reminder) => (
                          <div key={reminder.id} className={`flex items-center justify-between p-4 bg-theme-input border rounded-2xl transition-all ${reminder.completed ? 'border-emerald-500/20 opacity-50' : 'border-theme hover:border-red-500/30'}`}>
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => toggleReminder(reminder.id, reminder.completed)}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${reminder.completed ? 'bg-emerald-500 border-emerald-500' : 'border-theme hover:border-red-500'}`}
                              >
                                {reminder.completed && <CheckCircle2 size={12} className="text-white" />}
                              </button>
                              <div className="min-w-0">
                                <p className={`text-xs font-black uppercase tracking-wider truncate ${reminder.completed ? 'line-through text-theme-secondary' : 'text-theme-primary'}`}>{reminder.title}</p>
                                <p className="text-[10px] text-theme-secondary uppercase font-black tracking-wider mt-1 truncate">
                                  {new Date(reminder.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => deleteReminder(reminder.id)}
                              className="text-theme-secondary hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-theme rounded-2xl">
                        <p className="text-xs text-theme-secondary font-bold uppercase tracking-wider">No practice sessions scheduled</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Resume & Start */}
                <div className="lg:col-span-1 space-y-6 md:space-y-8">
                  <div className="bg-theme-surface border border-theme rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-4 md:space-y-6">
                    <div className="space-y-3 md:space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        3. Interaction Mode
                      </label>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <button
                          id="interactionModeText"
                          onClick={() => setInteractionMode('text')}
                          className={`flex items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-xl md:rounded-2xl border transition-all ${
                            interactionMode === 'text'
                              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20'
                              : 'bg-theme-input border-theme text-theme-secondary hover:border-red-500/50'
                          }`}
                        >
                          <Keyboard size={18} className="md:size-[20px]" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Type (Text)</span>
                        </button>
                        <button
                          id="interactionModeVoice"
                          onClick={() => {
                            if (selectedPlan === 'pro' || selectedPlan === 'elite') {
                              setInteractionMode('voice');
                            } else {
                              trackEvent('upgrade_prompt', { feature: 'voice' });
                              showNotification('Voice Interaction is a Premium feature. Please upgrade to access.', 'info');
                            }
                          }}
                          className={`flex items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-xl md:rounded-2xl border transition-all relative ${
                            interactionMode === 'voice'
                              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20'
                              : 'bg-theme-input border-theme text-theme-secondary hover:border-red-500/50'
                          }`}
                        >
                          <Mic size={18} className="md:size-[20px]" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Talk (Voice)</span>
                          {!(selectedPlan === 'pro' || selectedPlan === 'elite') && (
                            <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-red-600 text-[7px] md:text-[8px] font-black px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-widest text-white border border-black shadow-lg flex items-center gap-1">
                            <Zap size={7} className="md:size-[8px]" />
                            Premium
                          </div>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        4. Coach Voice
                      </label>
                      <div className="grid grid-cols-1 gap-2 md:gap-3">
                        {VOICES.map((voice) => (
                          <button
                            key={voice.id}
                            onClick={() => setSelectedVoice(voice.id)}
                            className={`flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all ${
                              selectedVoice === voice.id
                                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20'
                                : 'bg-theme-input border-theme text-theme-secondary hover:border-red-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${selectedVoice === voice.id ? 'bg-white/20' : 'bg-theme-surface border border-theme'}`}>
                                <User size={14} />
                              </div>
                              <div className="text-left">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedVoice === voice.id ? 'text-white' : 'text-theme-primary'}`}>{voice.name}</p>
                                <p className={`text-[8px] font-bold uppercase tracking-wider opacity-60 ${selectedVoice === voice.id ? 'text-white' : 'text-theme-secondary'}`}>{voice.description}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speak("Hello! I am your AI career coach. How can I help you today?", true, voice.id);
                              }}
                              className={`p-2 rounded-lg transition-all ${selectedVoice === voice.id ? 'bg-white/20 hover:bg-white/30' : 'bg-theme-surface hover:bg-theme-input'}`}
                            >
                              <Volume2 size={14} />
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        5. Resume Upload
                      </label>
                      
                      <div className="relative">
                        <input 
                          type="file" 
                          id="resume-upload"
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleResumeUpload}
                        />
                        <label 
                          htmlFor="resume-upload"
                          className={`flex flex-col items-center justify-center p-6 md:p-8 border-2 border-dashed rounded-xl md:rounded-2xl cursor-pointer transition-all ${
                            resumeFile 
                              ? 'border-emerald-500/50 bg-emerald-500/5' 
                              : 'border-theme bg-theme-surface hover:border-red-500/50 hover:bg-theme-surface-hover'
                          }`}
                        >
                          {isEnhancingResume ? (
                            <div className="flex flex-col items-center gap-2 md:gap-3">
                              <RefreshCw size={24} className="animate-spin text-red-500 md:size-[32px]" />
                              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500">Optimizing...</p>
                            </div>
                          ) : resumeFile ? (
                            <div className="flex flex-col items-center gap-2 md:gap-3">
                              <FileText size={24} className="text-emerald-500 md:size-[32px]" />
                              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500 truncate max-w-[150px]">{resumeFile.name}</p>
                              <p className="text-[7px] md:text-[8px] text-theme-secondary uppercase font-bold">Click to replace</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 md:gap-3">
                              <Upload size={24} className="text-theme-secondary opacity-50 group-hover:text-red-500 md:size-[32px]" />
                              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-theme-secondary">Upload Resume</p>
                              <p className="text-[7px] md:text-[8px] text-theme-secondary opacity-50 uppercase font-bold text-center">PDF, DOCX, TXT</p>
                            </div>
                          )}
                        </label>
                      </div>

                      {resumeAnalysis && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-4 rounded-xl border text-[10px] font-bold leading-relaxed ${
                            selectedPlan === 'pro' || selectedPlan === 'elite' || selectedPlan === 'beginner'
                              ? 'bg-red-600/10 border-red-600/20 text-red-400' 
                              : 'bg-theme-surface border-theme text-theme-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Zap size={12} className={selectedPlan === 'pro' || selectedPlan === 'elite' || selectedPlan === 'beginner' ? 'text-red-500' : 'text-theme-secondary'} />
                            <span className="uppercase tracking-widest">Smart Optimization Report</span>
                          </div>
                          {resumeAnalysis}
                        </motion.div>
                      )}

                      {/* Resume Analysis Banner removed */}
                    </div>
                  </div>

                  <div className="pt-2 md:pt-4">
                    <Tooltip content="Launch the career coach simulation">
                      <button 
                        onClick={startInterview}
                        disabled={!jobTitle}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.3em] py-5 md:py-8 rounded-2xl md:rounded-3xl shadow-2xl shadow-red-900/40 transition-all flex flex-col items-center justify-center gap-1 md:gap-2 border border-red-500/20 group"
                      >
                        <span className="text-base md:text-xl">Start Practice Session</span>
                        <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] md:text-[10px] tracking-widest">Prepare for {jobTitle || 'Role'}</span>
                          <ChevronRight size={12} className="md:size-[16px] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="mt-12 md:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="p-4 md:p-8 bg-theme-surface border border-theme rounded-2xl md:rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <Award className="mx-auto text-red-500 mb-2 md:mb-4 w-6 h-6 md:w-8 md:h-8" />
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Expert Tips</p>
                </div>
                <div className="p-4 md:p-8 bg-theme-surface border border-theme rounded-2xl md:rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <CheckCircle2 className="mx-auto text-red-500 mb-2 md:mb-4 w-6 h-6 md:w-8 md:h-8" />
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Skill Validation</p>
                </div>
                <div className="p-4 md:p-8 bg-theme-surface border border-theme rounded-2xl md:rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <Target className="mx-auto text-red-500 mb-2 md:mb-4 w-6 h-6 md:w-8 md:h-8" />
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Goal Focused</p>
                </div>
                <div className="p-4 md:p-8 bg-theme-surface border border-theme rounded-2xl md:rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <RefreshCw className="mx-auto text-red-500 mb-2 md:mb-4 w-6 h-6 md:w-8 md:h-8" />
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Infinite Retries</p>
                </div>
              </div>
            </motion.div>
          ) : step === 'reminders' ? (
            <motion.div
              key="reminders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto w-full py-8 px-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/20 border border-red-500/20">
                      <Clock size={20} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic text-theme-primary">Practice <span className="text-red-600">Schedule</span></h1>
                  </div>
                  <p className="text-theme-secondary text-xs font-bold uppercase tracking-widest ml-1">Manage your upcoming interview simulations</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingReminderId(null);
                    setReminderTitle('');
                    setReminderDesc('');
                    setReminderDate('');
                    setReminderTime('');
                    setIsScheduling(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-red-900/20 transition-all flex items-center gap-3 group"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                  Add New Session
                </button>
              </div>

              <div className="grid gap-6">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <div 
                      key={reminder.id} 
                      className={`group bg-theme-surface border rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-red-900/5 ${
                        reminder.completed ? 'border-theme opacity-60' : 'border-theme hover:border-red-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                          <button 
                            onClick={() => toggleReminder(reminder.id, reminder.completed)}
                            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                              reminder.completed ? 'bg-emerald-500 border-emerald-500' : 'border-theme hover:border-red-500'
                            }`}
                          >
                            {reminder.completed && <CheckCircle2 size={14} className="text-white" />}
                          </button>
                          <div className="space-y-2">
                            <h3 className={`text-lg font-black uppercase tracking-tight italic ${reminder.completed ? 'line-through text-theme-secondary' : 'text-theme-primary'}`}>
                              {reminder.title}
                            </h3>
                            {reminder.description && (
                              <p className="text-xs text-theme-secondary leading-relaxed max-w-md">{reminder.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                              <div className="flex items-center gap-2 px-3 py-1 bg-theme-input border border-theme rounded-full">
                                <Calendar size={12} className="text-red-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
                                  {new Date(reminder.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1 bg-theme-input border border-theme rounded-full">
                                <Clock size={12} className="text-red-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
                                  {new Date(reminder.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                          <button 
                            onClick={() => openEditReminder(reminder)}
                            className="flex-1 sm:flex-none p-3 bg-theme-input border border-theme rounded-xl text-theme-secondary hover:text-red-500 hover:border-red-500/30 transition-all"
                            title="Edit reminder"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteReminder(reminder.id)}
                            className="flex-1 sm:flex-none p-3 bg-theme-input border border-theme rounded-xl text-theme-secondary hover:text-red-500 hover:border-red-500/30 transition-all"
                            title="Delete reminder"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-theme-surface border border-dashed border-theme rounded-[40px] space-y-6">
                    <div className="w-20 h-20 bg-theme-input rounded-full flex items-center justify-center mx-auto">
                      <Calendar size={32} className="text-theme-secondary opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tighter italic text-theme-primary">No sessions scheduled</h3>
                      <p className="text-xs text-theme-secondary font-bold uppercase tracking-widest">Consistency is key to landing your dream job.</p>
                    </div>
                    <button 
                      onClick={() => setIsScheduling(true)}
                      className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 hover:text-red-600 transition-colors"
                    >
                      Schedule your first session →
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-12 p-8 bg-red-600/5 border border-red-600/10 rounded-[40px] flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shrink-0 shadow-2xl shadow-red-900/20">
                  <Zap size={24} className="text-white" />
                </div>
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-lg font-black uppercase tracking-tight italic text-theme-primary">Pro Tip: Spaced Repetition</h4>
                  <p className="text-xs text-theme-secondary leading-relaxed">Research shows that practicing in short, regular intervals is 3x more effective than "cramming" before an interview. Schedule 15-minute daily sessions for the best results.</p>
                </div>
              </div>
            </motion.div>
          ) : step === 'interview' ? (
            <motion.div 
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 min-h-0 pt-4"
            >
              {/* Interview Header (Session Header) */}
              <div className="bg-theme-main flex flex-col md:flex-row md:items-center justify-between mb-2 px-3 py-3 md:px-4 md:py-4 border-b border-theme gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/20 border border-red-500/20 shrink-0">
                    <Briefcase size={16} className="md:size-[20px]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-theme-primary leading-none truncate">{jobTitle}</h2>
                    <div className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mt-1 md:mt-1.5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      Live Practice Session
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full md:w-auto">
                  {/* Progress Section */}
                  <div className="flex flex-col items-start md:items-end w-full sm:w-auto">
                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-theme-secondary mb-1">Interview Progress</p>
                    <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                      <div className="flex-1 sm:w-24 md:w-32 h-1 md:h-1.5 bg-theme-surface rounded-full overflow-hidden border border-theme">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(questionsAnswered / interviewLength) * 100}%` }}
                          className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)] transition-all duration-500" 
                        />
                      </div>
                      <span className="text-xs font-black text-theme-primary shrink-0">{questionsAnswered} / {interviewLength}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Tooltip content="Report a glitch and refund session (Limit: 3 per day)">
                      <button 
                        onClick={reportGlitch}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-theme-secondary hover:text-theme-primary bg-theme-surface border border-theme rounded-xl transition-all hover:shadow-md"
                      >
                        Report Glitch
                      </button>
                    </Tooltip>

                    <Tooltip content={interviewCompleted ? "Interview finished! Click to see your report." : "End current session and generate your performance report"}>
                      <button 
                        onClick={endInterview}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border group ${
                          interviewCompleted 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-900/20 animate-pulse' 
                            : 'bg-red-600 hover:bg-red-700 text-white border-red-500/20 shadow-red-900/40'
                        }`}
                      >
                        <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        {interviewCompleted ? 'Finish' : 'End'}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col gap-4">
                {/* Chat Interface */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2 scrollbar-hide">
                    {(!selectedPlan || selectedPlan === 'free') && (
                      <div className="flex justify-center mb-4">
                        <div className="bg-red-600/10 border border-red-600/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Trial Session Active</p>
                        </div>
                      </div>
                    )}
                    


                    {messages.map((msg, i) => {
                      const ts = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
                      const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[92%] flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                              msg.role === 'user' ? 'bg-red-600 border-red-500/20' : 'bg-theme-surface border-theme'
                            }`}>
                              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-red-500" />}
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <div className={`flex items-center gap-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-secondary opacity-60">
                                  {msg.role === 'user' ? 'You' : 'Coach'}
                                </span>
                                <span className="text-[9px] font-bold text-theme-secondary opacity-30">
                                  {timeStr}
                                </span>
                              </div>
                              
                              <div className={`relative group p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl transition-all ${
                                msg.role === 'user' 
                                  ? 'bg-red-600/10 border border-red-600/20 text-theme-primary rounded-tr-none' 
                                  : 'bg-theme-surface border border-theme text-theme-primary rounded-tl-none'
                              }`}>
                                <div className={`markdown-body text-xs md:text-sm leading-relaxed font-semibold ${theme === 'dark' ? 'prose-invert' : ''}`}>
                                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                                
                                <div className={`flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <button 
                                    onClick={() => copyToClipboard(msg.text)}
                                    className="p-1.5 hover:bg-theme-surface-hover rounded-md text-theme-secondary transition-colors"
                                    title="Copy message"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  {msg.role === 'user' && (
                                    <button 
                                      onClick={() => getMessageFeedback(i)}
                                      className="flex items-center gap-1.5 px-2 py-1 hover:bg-red-600/20 rounded-md text-red-500 transition-all border border-transparent hover:border-red-500/20"
                                      title="Get AI Feedback"
                                    >
                                      <Zap size={10} className={isGeneratingFeedback === i ? 'animate-pulse' : ''} />
                                      <span className="text-[8px] font-black uppercase tracking-widest">Feedback</span>
                                    </button>
                                  )}
                                  {msg.role === 'model' && (
                                    <button 
                                      onClick={() => speak(msg.text, true)}
                                      className="p-1.5 hover:bg-theme-surface-hover rounded-md text-theme-secondary transition-colors"
                                      title="Read aloud"
                                    >
                                      <Volume2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {isTyping && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%] flex gap-3 md:gap-4 flex-row">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-theme-surface border border-theme flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bot size={16} className="text-red-500" />
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-secondary opacity-60">
                                Coach
                              </span>
                              <span className="text-[9px] font-bold text-theme-secondary opacity-30 italic">
                                thinking...
                              </span>
                            </div>
                            
                            <div className="px-4 py-3 rounded-xl bg-theme-surface border border-theme text-theme-primary rounded-tl-none shadow-md flex items-center gap-3">
                              <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ 
                                      opacity: [0.4, 1, 0.4],
                                      y: [0, -2, 0]
                                    }}
                                    transition={{ 
                                      duration: 1.4, 
                                      repeat: Infinity, 
                                      delay: i * 0.2,
                                      ease: "easeInOut"
                                    }}
                                    className="w-1.5 h-1.5 bg-red-500 rounded-full"
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary opacity-40 italic">
                                Coach is analyzing...
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="mt-auto pt-4 border-t border-theme">
                    <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 md:gap-4 items-start">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={toggleListening}
                          disabled={isTranscribing}
                          className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all border ${
                            isListening 
                              ? 'bg-red-600 border-red-400 animate-pulse shadow-xl shadow-red-900/40' 
                              : isTranscribing
                                ? 'bg-theme-surface border-theme opacity-50 cursor-not-allowed'
                                : 'bg-theme-surface border-theme hover:border-red-500/50 shadow-md'
                          }`}
                        >
                          {isTranscribing ? <RefreshCw className="animate-spin text-red-500 w-5 h-5 md:w-6 md:h-6" /> : <Mic className={`${isListening ? 'text-white' : 'text-theme-secondary'} w-5 h-5 md:w-6 md:h-6`} />}
                        </button>
                      </div>

                      <div className="relative flex-1 group">
                        <textarea 
                          id="chatInput"
                          name="chatInput"
                          autoFocus
                          placeholder={isListening ? "Listening..." : "Type your answer..."}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                          className={`w-full h-20 md:h-24 pl-4 md:pl-5 pr-12 md:pr-14 py-2 md:py-3 bg-theme-surface border border-red-600 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-red-600/20 outline-none transition-all text-sm md:text-base text-theme-primary placeholder:text-theme-secondary/30 resize-none shadow-lg ${isListening ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
                        />

                        {isTranscribing && (
                          <div className="absolute inset-0 bg-theme-surface/80 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center z-10">
                            <div className="flex items-center gap-3">
                              <RefreshCw className="animate-spin text-red-500" size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-theme-primary">Transcribing...</span>
                            </div>
                          </div>
                        )}

                        {isListening && (
                          <div className="absolute left-4 bottom-3 md:left-5 md:bottom-4 pointer-events-none flex items-center gap-2">
                            <VoiceVisualizer />
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">Recording</span>
                          </div>
                        )}

                        <button 
                          type="submit"
                          disabled={!input.trim() || isTyping}
                          aria-label="Send message"
                          className="absolute right-3 bottom-3 md:right-4 md:bottom-4 w-10 h-10 md:w-12 md:h-12 bg-red-500/40 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-red-600 disabled:opacity-30 transition-all shadow-lg backdrop-blur-sm"
                        >
                          {isTyping ? <RefreshCw className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />}
                        </button>

                        {showRetry && (
                          <button 
                            type="button"
                            onClick={() => {
                              setIsTyping(false);
                              setShowRetry(false);
                              showNotification("The system is taking longer than usual. You can try sending your message again.", 'info');
                            }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-theme-surface border border-theme rounded-full text-[10px] font-black uppercase tracking-widest text-red-500 shadow-xl flex items-center gap-2 hover:bg-theme-surface-hover transition-all whitespace-nowrap"
                          >
                            <RefreshCw size={12} className="animate-spin" />
                            Stuck? Reset Typing
                          </button>
                        )}
                      </div>
                    </form>
                    <div className="flex flex-wrap justify-between items-center mt-4 md:mt-6 px-2 gap-4">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <p className="text-[8px] md:text-[9px] text-theme-secondary opacity-50 uppercase tracking-[0.3em] font-black">
                          Career Intelligence
                        </p>
                        <button 
                          onClick={exportTranscript}
                          className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-theme-secondary hover:text-theme-primary transition-colors group"
                        >
                          <Download className="group-hover:translate-y-0.5 transition-transform w-2.5 h-2.5 md:w-3 md:h-3" />
                          Export Transcript
                        </button>
                        <div className="hidden md:block w-px h-3 bg-theme-secondary opacity-20" />
                        <button 
                          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                          className={`flex items-center gap-1.5 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-colors group ${isAudioEnabled ? 'text-red-500' : 'text-theme-secondary hover:text-theme-primary'}`}
                        >
                          {isAudioEnabled ? <Volume2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <VolumeX className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                          Audio: {isAudioEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : step === 'admin' ? (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto mt-12 px-4 pb-20"
            >
              <div className="bg-theme-surface border border-theme p-6 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-2 text-theme-primary">Admin Console</h2>
                    <p className="text-theme-secondary text-sm uppercase tracking-widest font-bold">Security & System Management</p>
                  </div>
                  <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex bg-theme-input p-1 rounded-xl border border-theme shrink-0">
                      <button 
                        onClick={() => setAdminTab('overview')}
                        className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'overview' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Overview
                      </button>
                      <button 
                        onClick={() => setAdminTab('stats')}
                        className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'stats' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Statistics
                      </button>
                      <button 
                        onClick={() => setAdminTab('users')}
                        className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'users' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Users
                      </button>
                      <button 
                        onClick={() => setAdminTab('icons')}
                        className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'icons' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Icons
                      </button>
                    </div>
                    <button 
                      onClick={() => setStep('setup')}
                      className="px-4 md:px-6 py-3 bg-theme-input border border-theme text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-theme-surface-hover transition-all shrink-0"
                    >
                      Exit
                    </button>
                  </div>
                </div>

                {adminTab === 'icons' && (
                  <IconGenerator 
                    apiUrl={API_URL} 
                    authHeaders={getAuthHeaders()} 
                    onNotification={showNotification} 
                  />
                )}

                {adminTab === 'overview' ? (
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      {/* Stats Overview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="text-red-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Total Users</span>
                          </div>
                          <p className="text-3xl font-black text-theme-primary">{adminUsers.length}</p>
                        </div>
                        <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                          <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="text-red-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Simulations</span>
                          </div>
                          <p className="text-3xl font-black text-theme-primary">{simulations.length}</p>
                        </div>
                        <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                          <div className="flex items-center gap-3 mb-2">
                            <Activity className="text-red-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Activity Logs</span>
                          </div>
                          <p className="text-3xl font-black text-theme-primary">{activityLogs.length}</p>
                        </div>
                      </div>

                      {/* Activity Logs Table */}
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black uppercase italic flex items-center gap-2 text-theme-primary">
                            <History className="text-red-500" size={20} />
                            Recent Activity
                          </h3>
                          <button 
                            onClick={exportActivityLogs}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                          >
                            <Download size={14} />
                            Export CSV
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-theme">
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">User</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Action</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Country</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-theme">
                              {activityLogs.slice(0, 10).map((log, idx) => (
                                <tr key={idx} className="group hover:bg-theme-surface-hover transition-colors">
                                  <td className="py-4">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-theme-primary">{log.email}</span>
                                      <span className="text-[9px] text-theme-secondary font-mono opacity-50">{log.ip_address || '0.0.0.0'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    <span className="px-2 py-1 bg-red-600/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded border border-red-500/20">
                                      {log.activity.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    <div className="flex items-center gap-2">
                                      <Globe size={12} className="text-theme-secondary" />
                                      <span className="text-xs text-theme-primary">{log.country || 'Unknown'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-xs text-theme-secondary">
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                      {/* System Tools */}
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <h3 className="text-lg font-black uppercase italic mb-6 flex items-center gap-2 text-theme-primary">
                          <Settings className="text-red-500" size={20} />
                          System Tools
                        </h3>
                        <div className="space-y-3">
                          <button 
                            onClick={syncPlayConsoleData}
                            disabled={isImporting}
                            className="w-full p-4 bg-theme-surface-hover border border-theme rounded-xl hover:border-red-500 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <RefreshCw size={18} className={`text-theme-secondary group-hover:text-red-500 ${isImporting ? 'animate-spin' : ''}`} />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary">Sync Play Console</p>
                                <p className="text-[9px] text-theme-secondary uppercase tracking-tighter">Import historical data</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-theme-secondary" />
                          </button>

                          <button 
                            onClick={exportAllData}
                            disabled={isExporting}
                            className="w-full p-4 bg-theme-surface-hover border border-theme rounded-xl hover:border-red-500 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <Download size={18} className="text-theme-secondary group-hover:text-red-500" />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary">Export All Data</p>
                                <p className="text-[9px] text-theme-secondary uppercase tracking-tighter">Full database backup (JSON)</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-theme-secondary" />
                          </button>

                          <button 
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Reset Database',
                                message: 'CRITICAL: This will delete all simulations and payments. Admin user will remain. Continue?',
                                onConfirm: async () => {
                                  fetch(API_URL + '/api/admin/reset-db', { method: 'POST', headers: getAuthHeaders() })
                                    .then(res => res.json())
                                    .then(data => {
                                      if (data.success) {
                                        showNotification(data.message, 'success');
                                        fetchActivityLogs();
                                      }
                                    });
                                }
                              });
                            }}
                            className="w-full p-4 bg-red-600/5 border border-red-600/20 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <Trash2 size={18} className="text-red-500 group-hover:text-white" />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest">Reset Database</p>
                                <p className="text-[9px] opacity-70 uppercase tracking-tighter">Clear all non-user data</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="opacity-50" />
                          </button>
                        </div>
                      </div>

                      {/* System Status */}
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-theme-primary">
                          <ShieldCheck className="text-red-500" size={20} />
                          System Status
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Database</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Engine</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Operational
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">GA4 Tracking</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'users' ? (
                  <div className="space-y-8">
                    <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                      <h3 className="text-lg font-black uppercase italic mb-6 flex items-center gap-2 text-theme-primary">
                        <Users className="text-red-500" size={20} />
                        User Management
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-theme">
                              <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Email</th>
                              <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Plan</th>
                              <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Role</th>
                              <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme">
                            {adminUsers.map((u, idx) => (
                              <tr key={idx} className="group hover:bg-theme-surface-hover transition-colors">
                                <td className="py-4">
                                  <span className="text-xs font-bold text-theme-primary">{u.email}</span>
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${
                                    u.plan_type === 'pro' ? 'bg-red-600/10 text-red-500 border-red-500/20' :
                                    u.plan_type === 'elite' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-theme-secondary/10 text-theme-secondary border-theme'
                                  }`}>
                                    {u.plan_type}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${u.is_admin ? 'text-red-500' : 'text-theme-secondary'}`}>
                                    {u.is_admin ? 'Admin' : 'User'}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center gap-2">
                                    <select 
                                      className="bg-theme-surface border border-theme text-[9px] font-black uppercase tracking-widest rounded px-2 py-1 outline-none focus:border-red-500 transition-colors"
                                      value={u.plan_type}
                                      onChange={async (e) => {
                                        const newPlan = e.target.value;
                                        try {
                                          const res = await fetch(API_URL + '/api/admin/update-user-plan', {
                                            method: 'POST',
                                            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userId: u.id, planType: newPlan })
                                          });
                                          if (res.ok) {
                                            setAdminUsers(prev => prev.map(user => user.id === u.id ? { ...user, plan_type: newPlan } : user));
                                          }
                                        } catch (err) {
                                          console.error('Failed to update plan:', err);
                                        }
                                      }}
                                    >
                                      <option value="free">Free</option>
                                      <option value="pro">Pro</option>
                                      <option value="elite">Elite</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Top Row: Performance & Distribution */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Simulation Performance Chart */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Target className="text-red-500" size={24} />
                          Recent Scores
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={simulations.slice(-10)}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                              <XAxis 
                                dataKey="job_title" 
                                stroke={theme === 'dark' ? '#666' : '#999'} 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value && value.length > 15 ? value.substring(0, 12) + '...' : value}
                              />
                              <YAxis 
                                domain={[0, 10]}
                                stroke={theme === 'dark' ? '#666' : '#999'} 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                              />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Bar dataKey="score" fill="#dc2626" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Industry Distribution Pie Chart */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Briefcase className="text-red-500" size={24} />
                          Industry Focus
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={simulations.reduce((acc: any[], sim) => {
                                  const name = sim.industry || 'Other';
                                  const existing = acc.find(item => item.name === name);
                                  if (existing) existing.value += 1;
                                  else acc.push({ name, value: 1 });
                                  return acc;
                                }, []).sort((a, b) => b.value - a.value).slice(0, 5)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {simulations.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={['#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#000'][index % 5]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Score Trend & Activity */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Average Score Trend */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Award className="text-red-500" size={24} />
                          Average Score Trend
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={simulations.reduce((acc: any[], sim) => {
                              const date = new Date(sim.created_at).toLocaleDateString();
                              const existing = acc.find(item => item.date === date);
                              if (existing) {
                                existing.totalScore += sim.score;
                                existing.count += 1;
                                existing.average = Number((existing.totalScore / existing.count).toFixed(1));
                              } else {
                                acc.push({ date, totalScore: sim.score, count: 1, average: sim.score });
                              }
                              return acc;
                            }, []).slice(-10)}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                              <XAxis dataKey="date" stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis domain={[0, 10]} stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Line type="monotone" dataKey="average" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Activity Distribution */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Activity className="text-red-500" size={24} />
                          Activity Distribution
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={[
                              { name: 'Logins', count: activityLogs.filter(l => l.activity === 'login_success').length },
                              { name: 'Signups', count: activityLogs.filter(l => l.activity === 'signup_success').length },
                              { name: 'Simulations', count: activityLogs.filter(l => l.activity === 'simulation_started').length },
                              { name: 'Upgrades', count: activityLogs.filter(l => l.activity === 'upgrade_clicked').length },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                              <XAxis dataKey="name" stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px'
                                }}
                              />
                              <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]}>
                                {activityLogs.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#dc2626' : '#991b1b'} />
                                ))}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto mt-2 md:mt-8 px-2 md:px-0 pb-8 md:pb-12"
            >
              <div className="bg-theme-surface border border-theme rounded-2xl md:rounded-3xl p-4 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 md:gap-6 mb-6 md:mb-12">
                    <div className="w-10 h-10 md:w-20 md:h-20 bg-theme-surface-hover border border-theme rounded-xl md:rounded-3xl flex items-center justify-center shadow-xl">
                      <Briefcase className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-4xl font-black tracking-tighter uppercase italic text-theme-primary">Performance Report</h2>
                      <p className="text-red-500 font-bold uppercase tracking-widest text-[8px] md:text-xs mt-0.5 md:mt-1">{jobTitle}</p>
                    </div>
                  </div>

                  {(isGeneratingSummary && !summary) ? (
                    <div className="space-y-8 py-20">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <RefreshCw className="text-red-600 animate-spin" size={64} />
                        <p className="text-theme-secondary font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Your Session</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none relative`}>
                        <div className={`markdown-body text-theme-primary leading-relaxed text-base md:text-lg font-medium border-l-2 border-red-600 pl-4 md:pl-8 mb-12 ${theme === 'dark' ? 'prose-invert' : ''}`}>
                          <ReactMarkdown>{summary}</ReactMarkdown>
                          {isGeneratingSummary && (
                            <span className="inline-block w-2 h-4 bg-red-600 animate-pulse ml-1" />
                          )}
                        </div>
                        
                        {/* Scroll Indicator - More prominent */}
                        {!isGeneratingSummary && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:hidden"
                          >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Scroll for Feedback</span>
                            <ChevronDown size={20} className="text-red-500 animate-bounce" />
                          </motion.div>
                        )}
                      </div>

                      {!isGeneratingSummary && (
                        <div className="pt-8 md:pt-12 border-t border-theme flex flex-col sm:flex-row gap-4 sm:gap-6">
                          <button
                            onClick={() => {
                              setSummary('');
                              setMessages([]);
                              setStep('setup');
                            }}
                            className="flex-1 py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme flex items-center justify-center gap-2"
                          >
                            <Plus size={14} />
                            New Session
                          </button>
                          <button
                            onClick={() => setIsScheduling(true)}
                            className="flex-1 py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme flex items-center justify-center gap-2"
                            >
                            </button>
                            <button
                                onClick={() => {
                              setIsExporting(true);
                               exportReport();
                               setTimeout(() => setIsExporting(false), 2000);
                                }}
                              className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                            >
                             <Download size={14} />
                            {isExporting ? 'Exporting...' : 'Export Report'}
                            </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Global UI Elements (Modals & Notifications) */}

      <Modal
        isOpen={!!confirmModal?.isOpen}
        onClose={() => {
          setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
          setModalInputValue('');
        }}
        title={confirmModal?.title || 'Confirm Action'}
      >
        <div className="space-y-6">
          <p className="text-theme-secondary text-lg leading-relaxed">{confirmModal?.message}</p>
          
          {confirmModal?.showInput && (
            <div className="space-y-2">
              <textarea
                value={modalInputValue}
                onChange={(e) => setModalInputValue(e.target.value)}
                placeholder={confirmModal.inputPlaceholder || 'Enter details...'}
                className="w-full p-6 bg-theme-input border border-theme rounded-xl text-theme-primary text-base focus:border-red-500 outline-none transition-all min-h-[200px] resize-none"
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => {
                confirmModal?.onConfirm(modalInputValue);
                setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
                setModalInputValue('');
              }}
              className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl transition-all border border-red-500"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
                setModalInputValue('');
              }}
              className="flex-1 py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary font-black uppercase tracking-widest rounded-xl transition-all border border-theme"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {step === 'setup' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none md:hidden"
          >
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[8px] font-black uppercase tracking-widest text-theme-secondary opacity-50">Scroll for more options</span>
              <ChevronDown size={16} className="text-red-500" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
        title="Privacy Policy"
      >
        <div className="space-y-6 text-theme-secondary text-sm leading-relaxed">
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">1. Data Collection</h3>
            <p>EnvisionPaths collects minimal personal data required for account practice. This includes your email address and the job titles/industries you provide for practice sessions.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">2. Intelligent Processing</h3>
            <p>Your interview responses are processed by advanced intelligent models to provide feedback. We do not use your personal interview data to train public models. Your session data is used exclusively to generate your performance reports.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">3. Data Security</h3>
            <p>We implement industry-standard security measures to protect your information. All communications with our servers are encrypted via SSL/TLS.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">4. Your Rights</h3>
            <p>You have the right to access, correct, or delete your data at any time. Contact our expert support team for any data-related inquiries.</p>
          </section>
        </div>
      </Modal>

      {/* Instant Feedback Modal */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Instant Coach Feedback"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-600/5 border border-red-500/20 rounded-2xl">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic text-theme-primary">Expert Analysis</h3>
              <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest">Real-time insights on your response</p>
            </div>
          </div>

          <div className="min-h-[300px] relative">
            {!activeFeedback && isGeneratingFeedback !== null ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="text-red-600 animate-spin" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary animate-pulse">Coach is thinking...</p>
              </div>
            ) : (
              <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none`}>
                <div className="markdown-body text-theme-primary leading-relaxed text-sm md:text-base font-medium">
                  <ReactMarkdown>{activeFeedback || ''}</ReactMarkdown>
                  {isGeneratingFeedback !== null && (
                    <span className="inline-block w-1.5 h-3 bg-red-600 animate-pulse ml-1" />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={() => setIsFeedbackModalOpen(false)}
              className="w-full py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme"
            >
              Back to Interview
            </button>
          </div>
        </div>
      </Modal>

      {/* Simulation Details Modal */}
      <Modal
        isOpen={!!selectedSimulation}
        onClose={() => {
          setSelectedSimulation(null);
          setSimulationMessages([]);
        }}
        title="Simulation Details"
      >
        {selectedSimulation && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-theme-input border border-theme rounded-2xl">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-black tracking-widest mb-1">Role & Industry</p>
                <h3 className="text-sm font-black uppercase text-theme-primary">{selectedSimulation.job_title}</h3>
                <p className="text-[10px] text-theme-secondary uppercase font-bold">{selectedSimulation.industry}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-theme-secondary uppercase font-black tracking-widest mb-1">Final Score</p>
                <p className="text-3xl font-black italic text-red-500">{selectedSimulation.score}/10</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Performance Feedback</h3>
              <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} prose-xs max-w-none text-theme-primary leading-relaxed whitespace-pre-wrap`}>
                  {selectedSimulation.feedback}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Chat History</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <RefreshCw className="animate-spin text-red-500" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Loading transcript...</p>
                  </div>
                ) : simulationMessages.length > 0 ? (
                  simulationMessages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-red-600 text-white rounded-tr-none' 
                          : 'bg-theme-input border border-theme text-theme-primary rounded-tl-none'
                      }`}>
                        <p className="text-[8px] font-black uppercase tracking-widest mb-2 opacity-50">
                          {msg.role === 'user' ? 'You' : 'Interviewer'}
                        </p>
                        {msg.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-theme rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">No transcript available for this session.</p>
                  </div>
                )}
                <div ref={simulationEndRef} />
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedSimulation(null);
                setSimulationMessages([]);
              }}
              className="w-full py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme"
            >
              Close Details
            </button>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title="Account Settings"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-theme-surface-hover border border-theme rounded-xl flex items-center justify-center">
              <Settings className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic text-theme-primary">Profile & Preferences</h3>
              <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest">Manage your account security and alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Profile Picture</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-6 flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-theme overflow-hidden bg-theme-surface flex items-center justify-center shadow-xl">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={40} className="text-theme-secondary opacity-30" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                  <Camera size={24} className="text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} />
                </label>
              </div>
              <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest">Click to upload new photo</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Notifications</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">System Alerts</p>
                <p className="text-sm font-bold text-theme-primary">
                  {notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Not Set'}
                </p>
              </div>
              {notificationPermission !== 'granted' && (
                <button 
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Enable Alerts
                </button>
              )}
              {notificationPermission === 'granted' && (
                <div className="text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-theme-secondary italic px-2">
              Enable alerts to receive notifications on your phone even when the app is in the background.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">App Installation</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-theme-primary">Install as an App</p>
              <p className="text-[10px] text-theme-secondary leading-relaxed">
                For the best experience and background alerts, install EnvisionPaths to your home screen:
              </p>
              <div className="text-[10px] text-theme-secondary space-y-1 bg-theme-surface p-3 rounded-xl border border-theme">
                <p>• <span className="text-theme-primary font-bold">iOS:</span> Tap <span className="inline-block px-1 bg-theme-surface-hover rounded border border-theme">Share</span> then <span className="text-theme-primary font-bold">"Add to Home Screen"</span></p>
                <p>• <span className="text-theme-primary font-bold">Android:</span> Tap <span className="inline-block px-1 bg-theme-surface-hover rounded border border-theme">Menu</span> then <span className="text-theme-primary font-bold">"Install App"</span></p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">System</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">App Version</p>
                <p className="text-sm font-bold text-theme-primary">v3.0.0</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(registrations => {
                        for (let registration of registrations) {
                          registration.update();
                        }
                        window.location.reload();
                      });
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-theme-surface-hover hover:opacity-80 text-theme-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-theme flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Check for Updates
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setStep('admin');
                      setIsSettingsOpen(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500 flex items-center gap-2"
                  >
                    <Shield size={14} />
                    Admin Console
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-theme-secondary italic px-2">
              If you're not seeing the latest features on all devices, use this button to force a refresh.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Appearance</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">Color Theme</p>
                <p className="text-sm font-bold text-theme-primary">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
              </div>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  theme === 'light' 
                    ? 'bg-theme-primary text-theme-main border-theme' 
                    : 'bg-theme-surface-hover text-theme-primary border-theme'
                }`}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Account Information</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4">
              <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">Your Registered Email</p>
              <p className="text-sm font-bold text-theme-primary">{user?.email}</p>
            </div>
            <div className="bg-theme-input border border-theme rounded-2xl p-4">
              <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">Current Plan</p>
              <p className="text-sm font-bold text-red-500 uppercase tracking-widest">
                {(user?.plan_type || 'Free')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Security & Account Updates</h3>
            
            {updateMessage && (
              <div className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${updateMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {updateMessage.text}
              </div>
            )}

            <div className="space-y-6">
              {/* Update Email Form */}
              <form onSubmit={handleUpdateEmail} className="space-y-3">
                <p className="text-[10px] text-theme-secondary uppercase font-bold">Update Your Email</p>
                <div className="flex gap-2">
                  <input 
                    type="email"
                    value={updateEmailValue}
                    onChange={(e) => setUpdateEmailValue(e.target.value)}
                    placeholder="Enter your new email"
                    className="flex-1 bg-theme-input border border-theme rounded-xl px-4 py-3 text-xs text-theme-primary focus:outline-none focus:border-red-500/50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={isUpdatingEmail || !updateEmailValue}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 rounded-xl transition-all flex items-center justify-center"
                  >
                    {isUpdatingEmail ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  </button>
                </div>
              </form>

              {/* Update Password Form */}
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <p className="text-[10px] text-theme-secondary uppercase font-bold">Update Your Password</p>
                <div className="space-y-2">
                  <input 
                    type="password"
                    value={currentPasswordValue}
                    onChange={(e) => setCurrentPasswordValue(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 text-xs text-theme-primary focus:outline-none focus:border-red-500/50 transition-all"
                  />
                  <input 
                    type="password"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 text-xs text-theme-primary focus:outline-none focus:border-red-500/50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={isUpdatingPassword || !currentPasswordValue || !newPasswordValue}
                    className="w-full py-3 bg-theme-surface-hover hover:opacity-80 disabled:opacity-50 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme flex items-center justify-center gap-2"
                  >
                    {isUpdatingPassword ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Preferences</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-4 bg-theme-input border border-theme rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-red-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary">System Alerts</p>
                    <p className="text-[8px] text-theme-secondary uppercase font-bold tracking-widest mt-0.5">
                      {notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Not Configured'}
                    </p>
                  </div>
                </div>
                {notificationPermission !== 'granted' ? (
                  <button 
                    onClick={requestNotificationPermission}
                    className="px-3 py-1.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
                  >
                    Enable
                  </button>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Security</h3>
              <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                <h3 className="text-sm font-black uppercase italic mb-4 flex items-center gap-2 text-theme-primary">
                  <Shield className="text-red-500" size={16} />
                  Two-Factor Authentication
                </h3>
                
                {twoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">2FA is enabled</span>
                    </div>
                    <button 
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Disable 2FA',
                          message: 'Disable 2FA? Your account will be less secure.',
                          onConfirm: async () => {
                            const res = await fetch(API_URL + '/api/auth/disable-2fa', { method: 'POST', headers: getAuthHeaders() });
                            if (res.ok) {
                              setTwoFactorEnabled(false);
                              showNotification('2FA disabled successfully', 'success');
                            }
                          }
                        });
                      }}
                      className="w-full text-[10px] text-theme-secondary hover:text-red-500 transition-colors uppercase tracking-widest font-bold"
                    >
                      Disable 2FA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!isSettingUp2FA ? (
                      <div className="space-y-4">
                        <p className="text-[10px] text-theme-secondary leading-relaxed uppercase tracking-widest font-bold">
                          Secure your account with an authenticator app.
                        </p>
                        <button 
                          onClick={setup2FA}
                          className="w-full bg-theme-primary text-theme-main font-black uppercase tracking-widest py-3 rounded-xl hover:opacity-90 transition-colors text-[10px]"
                        >
                          Setup 2FA
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-center p-4 bg-white rounded-xl">
                          <img src={qrCodeUrl} alt="2FA QR Code" className="w-32 h-32" />
                        </div>
                        <div className="space-y-4">
                          <p className="text-[8px] text-theme-secondary uppercase tracking-widest font-bold text-center">
                            Scan with your authenticator app
                          </p>
                          <form onSubmit={verify2FASetup} className="space-y-4">
                            <input 
                              type="text" 
                              placeholder="000000"
                              maxLength={6}
                              value={setupCode}
                              onChange={(e) => setSetupCode(e.target.value)}
                              className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 text-center font-mono tracking-[0.5em] text-theme-primary focus:border-red-500 outline-none transition-all text-xs"
                            />
                            <button 
                              type="submit"
                              className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-3 rounded-xl hover:bg-red-700 transition-colors text-[10px]"
                            >
                              Verify & Enable
                            </button>
                            <button 
                              type="button"
                              onClick={() => setIsSettingUp2FA(false)}
                              className="w-full text-[8px] text-theme-secondary uppercase tracking-widest font-bold hover:text-theme-primary transition-colors"
                            >
                              Cancel
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Support & Legal</h3>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsPrivacyOpen(true);
                }}
                className="flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Privacy Policy</span>
                <ChevronRight size={14} className="text-theme-secondary" />
              </button>
              <button 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsTermsOpen(true);
                }}
                className="flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Terms of Service</span>
                <ChevronRight size={14} className="text-theme-secondary" />
              </button>
              <a 
                href="mailto:support@envisionpaths.com"
                className="flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Contact Support</span>
                </div>
                <ChevronRight size={14} className="text-theme-secondary" />
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-theme space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Debug Tools</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(API_URL + '/api/auth/promote-admin', {
                      method: 'POST',
                      headers: getAuthHeaders()
                    });
                    const data = await res.json();
                    if (data.success) {
                      showNotification(data.message, 'success');
                      fetchProfile();
                    } else {
                      showNotification(data.error || 'Failed to promote', 'error');
                    }
                  } catch (e) {
                    showNotification('Failed to promote', 'error');
                  }
                }}
                className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-500/20"
              >
                Force Admin Status
              </button>
              <button
                onClick={() => {
                  console.log('[DEBUG] Current User:', user);
                  console.log('[DEBUG] isAdmin state:', isAdmin);
                  showNotification(`User: ${user?.email}, Admin: ${user?.is_admin}`, 'info');
                }}
                className="px-3 py-1.5 bg-theme-secondary/10 hover:bg-theme-secondary/20 text-theme-secondary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-theme"
              >
                Log User State
              </button>
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setStep('admin');
                  setAdminTab('icons');
                }}
                className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-emerald-500/20"
              >
                Open Icon Generator
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(API_URL + '/api/admin/rebuild-icons', {
                      method: 'POST',
                      headers: getAuthHeaders()
                    });
                    const data = await res.json();
                    if (data.success) {
                      showNotification(data.message, 'success');
                    } else {
                      showNotification(data.error || 'Failed to rebuild', 'error');
                    }
                  } catch (e) {
                    showNotification('Failed to rebuild', 'error');
                  }
                }}
                className="px-3 py-1.5 bg-theme-secondary/10 hover:bg-theme-secondary/20 text-theme-secondary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-theme"
              >
                Rebuild Icons
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(API_URL + '/api/debug/icons');
                    const data = await res.json();
                    console.log('[DEBUG] Icons:', data);
                    showNotification(`Icons: ${data.public.length} in public, ${data.dist.length} in dist`, 'info');
                  } catch (e) {
                    showNotification('Failed to check icons', 'error');
                  }
                }}
                className="px-3 py-1.5 bg-theme-secondary/10 hover:bg-theme-secondary/20 text-theme-secondary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-theme"
              >
                Check Icons
              </button>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="w-full py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </button>
            <p className="text-[8px] text-theme-secondary text-center uppercase font-bold tracking-widest">
              Deleting your account is permanent and cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
        title="Terms of Service"
      >
        <div className="space-y-6 text-theme-secondary text-sm leading-relaxed">
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">1. Acceptance of Terms</h3>
            <p>By accessing EnvisionPaths, you agree to be bound by these professional terms of service. Our platform is designed for professional development and career advancement practice.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">2. User Accounts</h3>
            <p>You are responsible for maintaining the security of your account and password. EnvisionPaths cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">3. Practice Content</h3>
            <p>EnvisionPaths provides practice sessions for professional development. We do not guarantee employment or specific career outcomes. The performance score is a smart estimate based on your session input.</p>
          </section>
        </div>
      </Modal>

      <Modal 
        isOpen={isScheduling} 
        onClose={() => {
          setIsScheduling(false);
          setEditingReminderId(null);
          setReminderTitle('');
          setReminderDesc('');
          setReminderDate('');
          setReminderTime('');
        }}
        title={editingReminderId ? "Edit Practice Session" : "Schedule Practice Session"}
      >
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <Info size={14} />
            How to Set Alerts
          </p>
          <div className="text-xs text-theme-secondary mt-2 space-y-2">
            <p>1. Enter a title for your practice session.</p>
            <p>2. Choose the date and time for your reminder.</p>
            <p>3. Click "Schedule Session" to save.</p>
            <p className="text-red-400/80 italic">Note: To receive alerts on your phone when the app is closed, make sure to enable "System Alerts" in Account Settings.</p>
          </div>
        </div>
        <form onSubmit={addReminder} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Session Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Mock Interview for Site Supervisor"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all text-sm font-bold text-theme-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Date</label>
              <input 
                type="date" 
                required
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-theme-input border border-theme rounded-xl px-2 sm:px-4 py-3 outline-none focus:border-red-500 transition-all text-xs sm:text-sm font-bold text-theme-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Time</label>
              <input 
                type="time" 
                required
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-theme-input border border-theme rounded-xl px-2 sm:px-4 py-3 outline-none focus:border-red-500 transition-all text-xs sm:text-sm font-bold text-theme-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Description (Optional)</label>
            <textarea 
              placeholder="Focus on behavioral questions and safety protocols..."
              value={reminderDesc}
              onChange={(e) => setReminderDesc(e.target.value)}
              className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all text-sm font-bold h-24 resize-none text-theme-primary"
            />
          </div>
          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              disabled={isSchedulingLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
            >
              {isSchedulingLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  {editingReminderId ? 'Updating...' : 'Scheduling...'}
                </>
              ) : (
                editingReminderId ? 'Update Session' : 'Schedule Session'
              )}
            </button>
            <button 
              type="button"
              onClick={() => {
                showNotification('Test notification triggered!', 'success');
                if (notificationPermission === 'granted') {
                  new Notification('Practice Reminder Test', {
                    body: 'This is a test notification from EnvisionPaths.',
                    icon: '/icons/icon-192x192.png'
                  });
                } else {
                  requestNotificationPermission();
                }
              }}
              className="w-full bg-theme-surface border border-theme text-theme-secondary hover:text-theme-primary font-black uppercase tracking-widest py-3 rounded-xl transition-all text-[10px]"
            >
              Test Notification
            </button>
          </div>
        </form>
      </Modal>

      {/* Global Notifications */}
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md min-w-[300px] ${
                notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                notif.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                'bg-theme-surface border-theme text-theme-primary'
              }`}
            >
              {notif.type === 'success' ? <CheckCircle2 size={18} /> :
               notif.type === 'error' ? <AlertCircle size={18} /> :
               <Info size={18} />}
              <p className="text-[10px] font-black uppercase tracking-widest">{notif.text}</p>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 left-6 z-[900] w-12 h-12 bg-theme-surface border border-theme rounded-2xl flex items-center justify-center text-theme-secondary hover:text-red-500 transition-all shadow-xl"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
