'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Award, Calendar, CheckCircle2 } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SalaryData {
  baseSalary: number
  bonusRate: number
  totalEarnings: number
  monthlySalary: number
  bonus: number
  history: {
    month: string
    baseSalary: number
    bonus: number
    total: number
  }[]
}

export default function TeacherSalaryPage() {
  const { data: session } = useSession()
  const [salaryData, setSalaryData] = useState<SalaryData>({
    baseSalary: 0,
    bonusRate: 0,
    totalEarnings: 0,
    monthlySalary: 0,
    bonus: 0,
    history: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/salary')
      .then(res => res.json())
      .then(data => {
        if (data) setSalaryData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0'
    return num.toLocaleString('uz-UZ')
  }

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Maosh</h1>
            <p className="text-gray-400">Maosh ma'lumotlari va tarixi</p>
          </div>
        </div>

        {/* Salary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <p className="text-gray-300 font-medium mb-2">Asosiy maosh</p>
            <p className="text-3xl font-bold text-white">{formatNumber(salaryData.baseSalary)} so'm</p>
            <p className="text-sm text-gray-400 mt-2">Oylik maosh</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <Award className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-gray-300 font-medium mb-2">Bonus foizi</p>
            <p className="text-3xl font-bold text-white">{salaryData.bonusRate}%</p>
            <p className="text-sm text-gray-400 mt-2">Joriy oy bonus: {formatNumber(salaryData.bonus)} so'm</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <p className="text-gray-300 font-medium mb-2">Jami daromad</p>
            <p className="text-3xl font-bold text-white">{formatNumber(salaryData.totalEarnings)} so'm</p>
            <p className="text-sm text-gray-400 mt-2">Barcha vaqt</p>
          </div>
        </div>

        {/* Salary Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Joriy oy ma'lumotlari
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-gray-300 font-medium">Asosiy maosh</span>
                </div>
                <span className="text-white font-bold text-lg">{formatNumber(salaryData.baseSalary)} so'm</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-400" />
                  </div>
                  <span className="text-gray-300 font-medium">Bonus ({salaryData.bonusRate}%)</span>
                </div>
                <span className="text-green-400 font-bold text-lg">+{formatNumber(salaryData.bonus)} so'm</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-semibold text-lg">Jami</span>
                </div>
                <span className="text-green-400 font-bold text-2xl">
                  {formatNumber(salaryData.monthlySalary + salaryData.bonus)} so'm
                </span>
              </div>
            </div>
          </div>

          {/* Salary History Chart */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Maosh tarixi
            </h2>
            {salaryData.history.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salaryData.history}>
                    <defs>
                      <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="month" 
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
                      formatter={(value?: number) => [`${formatNumber(value || 0)} so'm`, 'Maosh']}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#22c55e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSalary)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Maosh tarixi mavjud emas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
