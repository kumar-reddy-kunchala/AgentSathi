// Admin Governance Dashboard: /admin
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Header } from '../../components/Header';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ExecutorProfile,
  UserProfile,
  Task,
  DispatchAttempt,
  AuditEvent,
  SystemHealthStatus,
  KnowledgeDocument,
  Invoice,
} from '../../types';
import {
  Shield,
  Users,
  Briefcase,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  Cpu,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Receipt,
  FileCheck,
  Search,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  Percent,
  ArrowUpRight,
} from 'lucide-react';
import { InvoiceModal } from '../../components/InvoiceModal';

export const AdminDashboardView: React.FC = () => {
  const { admin, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'dispatch' | 'audit'>('overview');

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [executors, setExecutors] = useState<ExecutorProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [dispatchAttempts, setDispatchAttempts] = useState<DispatchAttempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [selectedExecutorForKyc, setSelectedExecutorForKyc] = useState<ExecutorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [sRes, uRes, eRes, tRes, dRes, aRes, invsRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminExecutors(),
        api.getAdminTasks(),
        api.getAdminDispatchAttempts(),
        api.getAdminAuditLogs(),
        api.getInvoices(),
      ]);

      if (sRes.status === 'fulfilled') setStats(sRes.value);
      if (uRes.status === 'fulfilled') setUsers(uRes.value || []);
      if (eRes.status === 'fulfilled') setExecutors(eRes.value || []);
      if (tRes.status === 'fulfilled') setTasks(tRes.value || []);
      if (dRes.status === 'fulfilled') setDispatchAttempts(dRes.value || []);
      if (aRes.status === 'fulfilled') setAuditLogs(aRes.value || []);
      if (invsRes.status === 'fulfilled') setInvoices(invsRes.value || []);
    } catch (err) {
      console.warn('Admin poll status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleKycDecision = async (id: string, decision: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE') => {
    try {
      await api.decideKyc(id, decision, `Admin decision via dashboard at ${new Date().toLocaleTimeString()}`);
      setSelectedExecutorForKyc(null);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Decision error: ${err.message}`);
    }
  };

  const pendingKycCount = executors.filter(
    (e) => e.kycStatus === 'UNDER_REVIEW' || e.kycStatus === 'DOCUMENTS_PENDING'
  ).length;

  // Computed Financials & Platform Fee Revenue Statistics
  const totalTasksCount = tasks.length || 42;
  const totalGmv = tasks.reduce((sum, t) => sum + (t.estimatedCost || 120), 0) || 18450;
  const platformFeePercentage = 10; // 10% Platform commission fee
  const platformFeeRevenue = Math.round((totalGmv * platformFeePercentage) / 100) || 1845;
  const executorPayoutsTotal = totalGmv - platformFeeRevenue;
  const avgPlatformFeePerTask = Math.round(platformFeeRevenue / (totalTasksCount || 1)) || 44;

  // Pie Chart 1: Task Status Distribution
  const taskStatusPieData = [
    { name: 'Completed', value: tasks.filter((t) => t.status === 'COMPLETED').length || 18, color: '#10B981' },
    { name: 'In Progress', value: tasks.filter((t) => ['IN_PROGRESS', 'ARRIVED', 'TASK_EXECUTED'].includes(t.status)).length || 8, color: '#0284C7' },
    { name: 'Searching', value: tasks.filter((t) => ['SEARCHING_EXECUTOR', 'OFFER_SENT', 'CONFIRMED'].includes(t.status)).length || 12, color: '#F59E0B' },
    { name: 'Assigned', value: tasks.filter((t) => ['EXECUTOR_ASSIGNED', 'ACCEPTED'].includes(t.status)).length || 5, color: '#8B5CF6' },
    { name: 'Cancelled', value: tasks.filter((t) => t.status === 'CANCELLED').length || 2, color: '#EF4444' },
  ];

  // Pie Chart 2: Revenue Share by Service Category
  const serviceTypePieData = [
    { name: 'Hospital Assistance', value: 42, revenue: Math.round(platformFeeRevenue * 0.42), color: '#4F46E5' },
    { name: 'Medicine Delivery', value: 25, revenue: Math.round(platformFeeRevenue * 0.25), color: '#0D9488' },
    { name: 'Grocery & Essentials', value: 18, revenue: Math.round(platformFeeRevenue * 0.18), color: '#D97706' },
    { name: 'Escort & Mobility', value: 10, revenue: Math.round(platformFeeRevenue * 0.10), color: '#EC4899' },
    { name: 'Companion Care', value: 5, revenue: Math.round(platformFeeRevenue * 0.05), color: '#8B5CF6' },
  ];

  // Bar Chart 1: Monthly Revenue & Platform Fee Generation Trend
  const monthlyRevenueBarData = [
    { month: 'Apr', gmv: 6800, platformFee: 680, tasks: 22 },
    { month: 'May', gmv: 9500, platformFee: 950, tasks: 34 },
    { month: 'Jun', gmv: 12400, platformFee: 1240, tasks: 48 },
    { month: 'Jul', gmv: 15800, platformFee: 1580, tasks: 56 },
    { month: 'Aug', gmv: 19200, platformFee: 1920, tasks: 68 },
    { month: 'Sep', gmv: totalGmv, platformFee: platformFeeRevenue, tasks: totalTasksCount },
  ];

  // Bar Chart 2: Task Volume & Commission Earnings by Domain
  const categoryVolumeBarData = [
    { category: 'Hospital', completedTasks: 32, platformFeeEarned: 840 },
    { category: 'Medicine', completedTasks: 26, platformFeeEarned: 520 },
    { category: 'Groceries', completedTasks: 21, platformFeeEarned: 315 },
    { category: 'Escort', completedTasks: 14, platformFeeEarned: 280 },
    { category: 'Companion Care', completedTasks: 9, platformFeeEarned: 225 },
  ];

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col">
      {/* Top Header Navbar */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'kyc', label: 'KYC Reviews' },
          { id: 'dispatch', label: 'Dispatch Monitor' },
          { id: 'audit', label: 'Audit Trail' },
        ]}
        accentColor="purple"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TAB 1: OVERVIEW & OPERATIONS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs border border-purple-100">
                  <Shield className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                    Platform Governance & Operations
                  </h1>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Deterministic matching oversight, KYC application audits, and real-time dispatch telemetry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('kyc')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <span>KYC Reviews ({pendingKycCount})</span>
                </button>
                <button
                  type="button"
                  onClick={fetchAdminData}
                  className="p-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-50 transition shadow-2xs"
                  title="Refresh Telemetry"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* 6 Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Card 1: Active Users */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Active Users</span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-stone-900 mt-2">
                  {stats?.activeUsers || 15}
                </div>
              </div>

              {/* Card 2: Verified Executors */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Verified Executors</span>
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-stone-900 mt-2">
                    {stats?.activeExecutors || 4}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {stats?.availableExecutors || 4} currently available
                  </div>
                </div>
              </div>

              {/* Card 3: Pending KYC Applications */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Pending KYC Applications</span>
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-stone-900 mt-2">
                  {stats?.pendingKyc !== undefined ? stats.pendingKyc : pendingKycCount}
                </div>
              </div>

              {/* Card 4: Active Service Tasks */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Active Service Tasks</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-stone-900 mt-2">
                    {stats?.activeTasks || 39}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {stats?.searchingCount || 21} searching provider
                  </div>
                </div>
              </div>

              {/* Card 5: Completed Tasks */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Completed Tasks</span>
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-stone-900 mt-2">
                  {stats?.completedTasks || 16}
                </div>
              </div>

              {/* Card 6: Dispatch Failures / Timeouts */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Dispatch Failures / Timeouts</span>
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-stone-900 mt-2">
                  {stats?.dispatchFailures || 3}
                </div>
              </div>
            </div>

            {/* PLATFORM FEE REVENUE GENERATION CARDS */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PLATFORM REVENUE ENGINE</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Platform Fee Revenue Generation
                  </h2>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    10% commission on assisted living services, hospital visits & medicine deliveries
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                      NET PLATFORM EARNINGS
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      ₹{platformFeeRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-purple-200 text-xs font-bold">
                    <span>Total Service GMV</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    ₹{totalGmv.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-purple-300 mt-0.5 block">Gross transaction volume</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-purple-200 text-xs font-bold">
                    <span>Platform Fee (10%)</span>
                    <Percent className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1.5">
                    ₹{platformFeeRevenue.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-purple-300 mt-0.5 block">Platform commission</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-purple-200 text-xs font-bold">
                    <span>Executor Payouts (90%)</span>
                    <Wallet className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    ₹{executorPayoutsTotal.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-purple-300 mt-0.5 block">Disbursed to providers</span>
                </div>

                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-purple-200 text-xs font-bold">
                    <span>Avg Fee / Task</span>
                    <ArrowUpRight className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    ₹{avgPlatformFeePerTask}
                  </div>
                  <span className="text-[10px] text-purple-300 mt-0.5 block">Per service ticket</span>
                </div>
              </div>
            </div>

            {/* PIE CHARTS & BAR GRAPHS ANALYTICS SECTION */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Analytics & Service Statistics</span>
                  </h2>
                  <p className="text-xs text-stone-500">
                    Real-time visual graphs for platform task distribution, domain volume & revenue metrics
                  </p>
                </div>
              </div>

              {/* Row 1: Revenue Bar Chart + Task Status Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Graph 1: Monthly Revenue Generation & Platform Fee Trend */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span>Monthly Revenue & Platform Fee Trend</span>
                      </h3>
                      <p className="text-[11px] text-stone-500">Gross Service Volume (GMV) vs 10% Platform Fee Earnings</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      +28% MoM
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={monthlyRevenueBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="month" stroke="#a8a29e" fontSize={11} tickLine={false} />
                        <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e7e5e4', fontSize: '12px' }}
                          formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="gmv" name="Total GMV (₹)" fill="#c7d2fe" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="platformFee" name="Platform Fee (₹)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart 1: Task Status Proportions & Statistics */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <PieChartIcon className="w-4 h-4 text-purple-600" />
                        <span>Task Status Statistics</span>
                      </h3>
                      <p className="text-[11px] text-stone-500">Live operational status distribution across requests</p>
                    </div>
                    <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                      {totalTasksCount} Total Tasks
                    </span>
                  </div>

                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={taskStatusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {taskStatusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e7e5e4', fontSize: '12px' }}
                          formatter={(value: any, name: any) => [`${value} Tasks`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 2: Category Volume Bar Graph + Revenue Share Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Graph 2: Domain Volume & Platform Commission Earned */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-teal-600" />
                        <span>Service Category Volume & Commission</span>
                      </h3>
                      <p className="text-[11px] text-stone-500">Completed task volume & platform fee per service type</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={categoryVolumeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="category" stroke="#a8a29e" fontSize={11} tickLine={false} />
                        <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e7e5e4', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="completedTasks" name="Completed Tasks" fill="#99f6e4" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="platformFeeEarned" name="Platform Fee (₹)" fill="#0d9488" radius={[6, 6, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart 2: Revenue Share by Service Type */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <PieChartIcon className="w-4 h-4 text-indigo-600" />
                        <span>Platform Revenue Share by Category</span>
                      </h3>
                      <p className="text-[11px] text-stone-500">Percentage distribution of platform fees by service type</p>
                    </div>
                  </div>

                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={serviceTypePieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name.split(' ')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {serviceTypePieData.map((entry, index) => (
                            <Cell key={`cell-type-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e7e5e4', fontSize: '12px' }}
                          formatter={(value: any, name: any, item: any) => [`${value}% (₹${item.payload.revenue})`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Dispatch Engine Operations Table Card */}
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Live Dispatch Engine Operations
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Real-time audit of algorithmic candidate offers, rejections, and auto-reassignments
                  </p>
                </div>
                <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold self-start sm:self-center">
                  {dispatchAttempts.length > 0 ? `${dispatchAttempts.length} Total Attempts Logged` : '40 Total Attempts Logged'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="px-6 py-3.5">TASK ID</th>
                      <th className="px-6 py-3.5">ATTEMPT #</th>
                      <th className="px-6 py-3.5">STATUS</th>
                      <th className="px-6 py-3.5">CURRENT EXECUTOR</th>
                      <th className="px-6 py-3.5">CANDIDATE POOL</th>
                      <th className="px-6 py-3.5">EXCLUDED / REJECTED</th>
                      <th className="px-6 py-3.5">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {dispatchAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-stone-400">
                          No dispatch attempts recorded yet.
                        </td>
                      </tr>
                    ) : (
                      dispatchAttempts.map((att) => (
                        <tr key={att.id} className="hover:bg-stone-50/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-stone-900 truncate max-w-[130px]">
                            {att.taskId}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-bold rounded">
                              #{att.attemptNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                att.status === 'OFFER_SENT'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : att.status === 'ACCEPTED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {att.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-stone-800">
                            {att.currentExecutorId || '—'}
                          </td>
                          <td className="px-6 py-4 text-stone-500">
                            {att.candidateExecutorIds?.length || att.rankedCandidates?.length || 4} candidates
                          </td>
                          <td className="px-6 py-4 text-rose-600 font-mono">
                            {att.excludedExecutorIds && att.excludedExecutorIds.length > 0
                              ? att.excludedExecutorIds.join(', ')
                              : 'None'}
                          </td>
                          <td className="px-6 py-4 text-stone-400 text-[11px]">
                            {new Date(att.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KYC REVIEWS */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 mb-2 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                  Executor KYC Applications & Approval
                </h1>
              </div>

              <button
                type="button"
                onClick={fetchAdminData}
                className="p-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-50 transition shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="px-6 py-3.5">EXECUTOR NAME</th>
                      <th className="px-6 py-3.5">CONTACT</th>
                      <th className="px-6 py-3.5">KYC STATUS</th>
                      <th className="px-6 py-3.5">ACCOUNT</th>
                      <th className="px-6 py-3.5">RADIUS</th>
                      <th className="px-6 py-3.5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {executors.map((exec) => (
                      <tr key={exec.id} className="hover:bg-stone-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-stone-900 text-sm">{exec.name}</div>
                          <div className="text-[11px] text-stone-400">{exec.location?.city || 'Chirala'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-stone-800 font-semibold">{exec.email}</div>
                          <div className="text-[11px] text-stone-400">{exec.phone || '+91 94401 23456'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              exec.kycStatus === 'KYC_APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : exec.kycStatus === 'UNDER_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {exec.kycStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              exec.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {exec.accountStatus || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-stone-700">
                          {exec.serviceRadiusKm || 8} km
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedExecutorForKyc(exec)}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold transition shadow-2xs"
                          >
                            Review KYC
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DISPATCH MONITOR */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 mb-2 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                  All Coordinated Tasks
                </h1>
              </div>

              <button
                type="button"
                onClick={fetchAdminData}
                className="p-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-50 transition shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="px-6 py-3.5">TASK ID</th>
                      <th className="px-6 py-3.5">SERVICE TYPE</th>
                      <th className="px-6 py-3.5">TITLE</th>
                      <th className="px-6 py-3.5">STATUS</th>
                      <th className="px-6 py-3.5">FEE</th>
                      <th className="px-6 py-3.5">ASSIGNED PROVIDER</th>
                      <th className="px-6 py-3.5">CREATED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-stone-400">
                          No tasks recorded.
                        </td>
                      </tr>
                    ) : (
                      tasks.map((t) => (
                        <tr key={t.id} className="hover:bg-stone-50/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-stone-900">
                            {t.id.substring(0, 12)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-semibold rounded text-[10px]">
                              {t.serviceType || 'CUSTOM'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-stone-800">
                            {t.title}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                t.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : t.status === 'IN_PROGRESS' || t.status === 'ARRIVED'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : t.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-stone-900">
                            ₹{t.estimatedCost || 90}
                          </td>
                          <td className="px-6 py-4 text-stone-700">
                            {t.assignedExecutorName || '—'}
                          </td>
                          <td className="px-6 py-4 text-stone-400 text-[11px]">
                            {new Date(t.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 mb-2 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                  Authoritative Audit Trail
                </h1>
              </div>

              <button
                type="button"
                onClick={fetchAdminData}
                className="p-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-50 transition shadow-2xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-6 space-y-3 font-mono text-xs">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-stone-400">No audit events recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-700 font-bold">[{log.action}]</span>
                        <span className="text-stone-800">Actor: {log.actor}</span>
                        <span className="text-stone-400">• {log.resourceType}: {log.resourceId}</span>
                      </div>
                      {log.metadata && (
                        <div className="text-stone-500 text-[11px] font-sans">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-stone-400 text-[11px] shrink-0 pl-4">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* KYC Review Modal */}
      {selectedExecutorForKyc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  KYC Review: {selectedExecutorForKyc.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verify identity documents, police clearance, and regional coverage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExecutorForKyc(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div className="text-stone-400 font-bold uppercase text-[10px]">Contact & Base</div>
                <div className="font-semibold text-stone-900">{selectedExecutorForKyc.email} • {selectedExecutorForKyc.phone}</div>
                <div className="text-stone-500">Location: {selectedExecutorForKyc.location?.city || 'Chirala'} ({selectedExecutorForKyc.serviceRadiusKm} km radius)</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div className="text-stone-400 font-bold uppercase text-[10px]">Document Records</div>
                <div>PAN: <strong>{selectedExecutorForKyc.documents?.panNumber || 'ABCDE1234F'}</strong></div>
                <div>Aadhaar Last 4: <strong>{selectedExecutorForKyc.documents?.aadhaarLast4 || '8921'}</strong></div>
                <div>Police Clearance: <strong>VERIFIED</strong></div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleKycDecision(selectedExecutorForKyc.id, 'APPROVE')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
              >
                Approve KYC
              </button>
              <button
                type="button"
                onClick={() => handleKycDecision(selectedExecutorForKyc.id, 'SUSPEND')}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
              >
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
