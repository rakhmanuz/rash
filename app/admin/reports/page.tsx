'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import {
  FileText,
  Users,
  UserCog,
  DollarSign,
  Calendar,
  Award,
  BookOpen,
  Download,
  Filter,
  TrendingUp,
  Eye,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
const GRADIENT_COLORS = {
  green: ['#10b981', '#059669'],
  blue: ['#3b82f6', '#2563eb'],
  purple: ['#8b5cf6', '#7c3aed'],
  yellow: ['#f59e0b', '#d97706'],
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)
  const [visitorData, setVisitorData] = useState<any>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    if (activeTab === 'visitors') {
      fetchVisitorData()
      const interval = setInterval(() => {
        fetchVisitorData()
      }, 5000) // Har 5 soniyada yangilash
      return () => clearInterval(interval)
    } else {
      fetchReportData()
    }
  }, [activeTab, startDate, endDate, selectedDate])

  const fetchVisitorData = async () => {
    try {
      const response = await fetch('/api/admin/visitors')
      if (response.ok) {
        const data = await response.json()
        setVisitorData(data)
      }
    } catch (error) {
      console.error('Error fetching visitor data:', error)
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: activeTab })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedDate && activeTab === 'attendance') params.append('selectedDate', selectedDate)

      const response = await fetch(`/api/admin/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Umumiy ko\'rinish', icon: FileText },
    { id: 'visitors', label: 'Tashriflar', icon: Eye },
    { id: 'students', label: 'O\'quvchilar', icon: Users },
    { id: 'teachers', label: 'O\'qituvchilar', icon: UserCog },
    { id: 'financial', label: 'Moliyaviy', icon: DollarSign },
    { id: 'attendance', label: 'Davomat', icon: Calendar },
    { id: 'grades', label: 'Baholash', icon: Award },
    { id: 'groups', label: 'Guruhlar', icon: BookOpen },
  ]

  const renderOverview = () => {
    if (!reportData) return null

    // Radial chart data
    const radialData = [
      {
        name: 'O\'zlashtirish',
        value: reportData.averageMastery || 0,
        fill: '#10b981',
      },
      {
        name: 'Davomat',
        value: reportData.attendanceRate || 0,
        fill: '#3b82f6',
      },
    ]

    return (
      <div className="space-y-6">
        {/* Key Metrics with Radial Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* O'quvchilar - Radial Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-400" />
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="relative h-32 flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={[{ name: 'O\'quvchilar', value: Math.min((reportData.totalStudents / 100) * 100, 100), fill: '#3b82f6' }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#3b82f6"
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold fill-white"
                  >
                    {reportData.totalStudents}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-gray-400 font-medium">O'quvchilar</p>
          </div>

          {/* O'qituvchilar - Radial Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <UserCog className="h-8 w-8 text-purple-400" />
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="relative h-32 flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={[{ name: 'O\'qituvchilar', value: Math.min((reportData.totalTeachers / 10) * 100, 100), fill: '#8b5cf6' }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#8b5cf6"
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold fill-white"
                  >
                    {reportData.totalTeachers}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-gray-400 font-medium">O'qituvchilar</p>
          </div>

          {/* Daromad - Radial Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-yellow-400" />
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="relative h-32 flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={[{ 
                    name: 'Daromad', 
                    value: Math.min(((reportData.totalRevenue || 0) / 1000000) * 100, 100), 
                    fill: '#f59e0b' 
                  }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#f59e0b"
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-2xl font-bold fill-white"
                  >
                    {(reportData.totalRevenue || 0) > 1000000 
                      ? `${((reportData.totalRevenue || 0) / 1000000).toFixed(1)}M`
                      : (reportData.totalRevenue || 0) > 1000
                      ? `${((reportData.totalRevenue || 0) / 1000).toFixed(0)}k`
                      : (reportData.totalRevenue || 0).toLocaleString()
                    }
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-gray-400 font-medium">Jami daromad</p>
          </div>

          {/* O'zlashtirish - Radial Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Award className="h-8 w-8 text-green-400" />
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="relative h-32 flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={20}
                  data={[{ name: 'O\'zlashtirish', value: reportData.averageMastery || 0, fill: '#10b981' }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#10b981"
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold fill-white"
                  >
                    {reportData.averageMastery || 0}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-gray-400 font-medium">O'rtacha o'zlashtirish</p>
          </div>
        </div>

        {/* Professional Radial Charts for Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* O'zlashtirish va Davomat - Combined Radial */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Asosiy ko'rsatkichlar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="90%"
                    barSize={15}
                    data={[{ name: 'O\'zlashtirish', value: reportData.averageMastery || 0, fill: '#10b981' }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={8}
                      fill="#10b981"
                    />
                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-2xl font-bold fill-white"
                    >
                      {reportData.averageMastery || 0}%
                    </text>
                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-sm fill-gray-400"
                    >
                      O'zlashtirish
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="90%"
                    barSize={15}
                    data={[{ name: 'Davomat', value: reportData.attendanceRate || 0, fill: '#3b82f6' }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={8}
                      fill="#3b82f6"
                    />
                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-2xl font-bold fill-white"
                    >
                      {reportData.attendanceRate || 0}%
                    </text>
                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-sm fill-gray-400"
                    >
                      Davomat
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Moliyaviy holat - Donut Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Moliyaviy holat</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Daromad', value: reportData.totalRevenue || 0, fill: '#10b981' },
                    { name: 'Qarz', value: reportData.totalDebt || 0, fill: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Daromad', value: reportData.totalRevenue || 0, fill: '#10b981' },
                    { name: 'Qarz', value: reportData.totalDebt || 0, fill: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="45%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold fill-white"
                >
                  {(reportData.totalRevenue || 0) - (reportData.totalDebt || 0) > 0 ? '+' : ''}
                  {((reportData.totalRevenue || 0) - (reportData.totalDebt || 0)).toLocaleString()}
                </text>
                <text
                  x="50%"
                  y="55%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm fill-gray-400"
                >
                  Sof daromad
                </text>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-400">Daromad</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-400">Qarz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        {reportData.monthlyRevenue && reportData.monthlyRevenue.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Oylik daromad trendi</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Daromad</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={reportData.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="url(#colorRevenue)" 
                  name="Daromad (so'm)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    )
  }

  const renderStudents = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">O'quvchilar soni: {reportData.total}</h3>
        </div>

        {reportData.studentsByGroup && reportData.studentsByGroup.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Guruhlar bo'yicha taqsimot</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>O'quvchilar</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.studentsByGroup} barCategoryGap="20%">
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="group" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="url(#colorStudents)" 
                  name="O'quvchilar soni"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {reportData.levelDistribution && reportData.levelDistribution.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Daraja bo'yicha taqsimot</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={reportData.levelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={140}
                    paddingAngle={5}
                    labelLine={false}
                    label={({ percent, name }: any) => `${name || ''}\n${(percent * 100).toFixed(1)}%`}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.levelDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center space-y-4">
                {reportData.levelDistribution.map((entry: any, index: number) => {
                  const percentage = ((entry.count / reportData.total) * 100).toFixed(1)
                  return (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-5 h-5 rounded-full shadow-lg" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <p className="text-white font-semibold">{entry.level}</p>
                        </div>
                        <p className="text-white font-bold text-lg">{percentage}%</p>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-400 text-sm mt-2">{entry.count} ta o'quvchi</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderTeachers = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">O'qituvchilar soni: {reportData.total}</h3>
        </div>

        {reportData.teachers && reportData.teachers.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Ism</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Guruhlar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">O'quvchilar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Oylik maosh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reportData.teachers.map((teacher: any) => (
                    <tr key={teacher.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{teacher.user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.totalGroups}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.totalStudents}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{teacher.monthlySalary?.toLocaleString() || 0} so'm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFinancial = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 mb-2">Jami daromad</p>
            <p className="text-3xl font-bold text-green-400">{reportData.totalRevenue?.toLocaleString() || 0} so'm</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 mb-2">Qarzdorlik</p>
            <p className="text-3xl font-bold text-red-400">{reportData.totalDebt?.toLocaleString() || 0} so'm</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 mb-2">Sof daromad</p>
            <p className="text-3xl font-bold text-white">
              {((reportData.totalRevenue || 0) - (reportData.totalDebt || 0)).toLocaleString()} so'm
            </p>
          </div>
        </div>

        {reportData.dailyRevenue && reportData.dailyRevenue.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Kunlik daromad (oxirgi 30 kun)</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Daromad</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.dailyRevenue} barCategoryGap="10%">
                <defs>
                  <linearGradient id="colorDailyRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#colorDailyRevenue)" 
                  name="Daromad (so'm)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {reportData.paymentsByType && reportData.paymentsByType.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">To'lov turlari bo'yicha</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={reportData.paymentsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={140}
                    paddingAngle={5}
                    labelLine={false}
                    label={({ percent, name }: any) => `${name || ''}\n${(percent * 100).toFixed(1)}%`}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {reportData.paymentsByType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center space-y-4">
                {reportData.paymentsByType.map((entry: any, index: number) => {
                  const total = reportData.paymentsByType.reduce((sum: number, e: any) => sum + e.amount, 0)
                  const percentage = (entry.amount / total) * 100
                  return (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-5 h-5 rounded-full shadow-lg" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <p className="text-white font-semibold">{entry.type}</p>
                        </div>
                        <p className="text-white font-bold text-lg">{entry.amount.toLocaleString()} so'm</p>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-400 text-sm">{percentage.toFixed(1)}% jami daromaddan</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderAttendance = () => {
    if (!reportData) return null

    // Group attendance details by group
    const attendanceByGroup: { [key: string]: { present: any[]; absent: any[] } } = {}
    if (reportData.attendanceDetails) {
      reportData.attendanceDetails.forEach((att: any) => {
        if (!attendanceByGroup[att.groupName]) {
          attendanceByGroup[att.groupName] = { present: [], absent: [] }
        }
        if (att.isPresent) {
          attendanceByGroup[att.groupName].present.push(att)
        } else {
          attendanceByGroup[att.groupName].absent.push(att)
        }
      })
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-gray-700 shadow-xl">
            <p className="text-gray-400 mb-2">Jami davomat</p>
            <p className="text-3xl font-bold text-white">{reportData.totalAttendances}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 shadow-xl">
            <p className="text-gray-300 mb-2">Qatnashgan</p>
            <p className="text-3xl font-bold text-green-400">{reportData.presentAttendances}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 shadow-xl">
            <p className="text-gray-300 mb-2">Davomat darajasi</p>
            <p className="text-3xl font-bold text-blue-400">{reportData.attendanceRate}%</p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Kunni tanlang
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
              }}
              className="px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>

        {/* Attendance Details for Selected Date */}
        {selectedDate && reportData.attendanceDetails && reportData.attendanceDetails.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              {new Date(selectedDate).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })} - Davomat tafsilotlari
            </h3>
            
            <div className="space-y-6">
              {Object.entries(attendanceByGroup).map(([groupName, data]) => (
                <div key={groupName} className="bg-slate-700/50 rounded-xl p-6 border border-gray-600">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                    {groupName}
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Present Students */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <h5 className="text-md font-semibold text-green-400">
                          Qatnashgan ({data.present.length})
                        </h5>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {data.present.length > 0 ? (
                          data.present.map((att: any) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                            >
                              <div>
                                <p className="text-white font-medium">{att.studentName}</p>
                                <p className="text-xs text-gray-400">{att.studentUsername}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm p-3">Qatnashgan o'quvchilar yo'q</p>
                        )}
                      </div>
                    </div>

                    {/* Absent Students */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <h5 className="text-md font-semibold text-red-400">
                          Qatnashmagan ({data.absent.length})
                        </h5>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {data.absent.length > 0 ? (
                          data.absent.map((att: any) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                            >
                              <div>
                                <p className="text-white font-medium">{att.studentName}</p>
                                <p className="text-xs text-gray-400">{att.studentUsername}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-red-400" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm p-3">Qatnashmagan o'quvchilar yo'q</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDate && reportData.attendanceDetails && reportData.attendanceDetails.length === 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-12 border border-gray-700 shadow-xl text-center">
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Tanlangan kunda davomat ma'lumotlari topilmadi</p>
          </div>
        )}

        {reportData.dailyAttendance && reportData.dailyAttendance.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Kunlik davomat (oxirgi 30 kun)</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Qatnashgan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Qatnashmagan</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.dailyAttendance} barCategoryGap="10%">
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  style={{ fontSize: '11px' }}
                />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="present" 
                  fill="url(#colorPresent)" 
                  name="Qatnashgan"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="absent" 
                  fill="url(#colorAbsent)" 
                  name="Qatnashmagan"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  const renderGrades = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 mb-2">Jami baholar</p>
            <p className="text-3xl font-bold text-white">{reportData.totalGrades}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 mb-2">O'rtacha ball</p>
            <p className="text-3xl font-bold text-green-400">{reportData.averageScore}%</p>
          </div>
        </div>

        {reportData.gradesByGroup && reportData.gradesByGroup.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Guruhlar bo'yicha o'rtacha ball</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>O'rtacha ball</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.gradesByGroup} barCategoryGap="20%">
                <defs>
                  <linearGradient id="colorGrades" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="group" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="average" 
                  fill="url(#colorGrades)" 
                  name="O'rtacha ball (%)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {reportData.gradesByType && reportData.gradesByType.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Baholash turlari bo'yicha</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.gradesByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="average" fill="#f59e0b" name="O'rtacha ball (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  const renderVisitors = () => {
    if (!visitorData) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold text-white">{visitorData.realTime?.count || 0}</span>
            </div>
            <p className="text-gray-300 font-medium">Real vaqtda faol</p>
            <p className="text-sm text-gray-400 mt-1">Oxirgi 5 daqiqada</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">{visitorData.hourly?.count || 0}</span>
            </div>
            <p className="text-gray-300 font-medium">Soatlik tashriflar</p>
            <p className="text-sm text-gray-400 mt-1">Oxirgi 1 soatda</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">{visitorData.daily?.count || 0}</span>
            </div>
            <p className="text-gray-300 font-medium">Kunlik tashriflar</p>
            <p className="text-sm text-gray-400 mt-1">Oxirgi 24 soatda</p>
          </div>
        </div>

        {/* Real-time Visitor Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-400" />
              Real vaqtda tafsilotlar
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Kirgan foydalanuvchilar</span>
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {visitorData.realTime?.loggedIn || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Anonim tashriflar</span>
                </div>
                <span className="text-2xl font-bold text-blue-400">
                  {visitorData.realTime?.anonymous || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Hourly Chart */}
          {visitorData.hourlyChart && visitorData.hourlyChart.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
                Soatlik tashriflar (24 soat)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={visitorData.hourlyChart}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    stroke="#4b5563"
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    stroke="#4b5563"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number | undefined) => [`${value || 0} kishi`, 'Tashriflar']}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Page Views */}
        {visitorData.pageViews && visitorData.pageViews.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-yellow-400" />
              Sahifalar bo'yicha tashriflar
            </h3>
            <div className="space-y-3">
              {visitorData.pageViews
                .sort((a: any, b: any) => b.count - a.count)
                .map((pv: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <span className="text-gray-300 font-medium">{pv.page}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(pv.count / Math.max(...visitorData.pageViews.map((p: any) => p.count))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-bold w-12 text-right">{pv.count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderGroups = () => {
    if (!reportData) return null

    return (
      <div className="space-y-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Guruhlar soni: {reportData.total}</h3>
        </div>

        {reportData.groups && reportData.groups.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Guruh nomi</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">O'qituvchi</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">O'quvchilar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Sig'im</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">To'ldirilgan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reportData.groups.map((group: any) => (
                    <tr key={group.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{group.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{group.teacher.user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{group.totalStudents}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{group.capacity}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${group.utilizationRate}%` }}
                            ></div>
                          </div>
                          <span>{group.utilizationRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Yuklanmoqda...</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'visitors':
        return renderVisitors()
      case 'students':
        return renderStudents()
      case 'teachers':
        return renderTeachers()
      case 'financial':
        return renderFinancial()
      case 'attendance':
        return renderAttendance()
      case 'grades':
        return renderGrades()
      case 'groups':
        return renderGroups()
      default:
        return renderOverview()
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Hisobotlar</h1>
            <p className="text-gray-400">Barcha statistika va tahlillar</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchReportData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Yangilash</span>
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-slate-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Boshlanish:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Tugash:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-green-500 text-white border-b-2 border-green-400'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">{renderContent()}</div>
      </div>
    </DashboardLayout>
  )
}
