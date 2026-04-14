'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useState } from 'react'
import { Bot, CheckCircle2, FileText, Search, ShieldAlert, Upload } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

type QuestionItem = {
  index: number
  text: string
  options?: {
    A?: string
    B?: string
    C?: string
    D?: string
  }
  source?: 'text' | 'image'
  ai?: {
    status: 'good' | 'needs_fix'
    reason: string
    improvedText: string
    latexText?: string
  } | null
}

export default function AdminAiTekshiruvPage() {
  const [selectedWordFile, setSelectedWordFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionItem[]>([])

  const handleWordFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedWordFile(file)
    setError(null)
    setQuestions([])
  }

  const handleUploadAndParse = async () => {
    if (!selectedWordFile) return
    setUploading(true)
    setError(null)
    setQuestions([])

    try {
      const formData = new FormData()
      formData.append('file', selectedWordFile)

      const res = await fetch('/api/admin/ai-tekshiruv/parse', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Yuklashda xatolik yuz berdi')
        return
      }

      setQuestions(Array.isArray(data?.questions) ? data.questions : [])
    } catch (e) {
      console.error(e)
      setError('Yuklashda xatolik yuz berdi')
    } finally {
      setUploading(false)
    }
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI tekshiruv
          </h1>
          <p className="text-indigo-100 mt-2 text-sm sm:text-base">
            Sun&apos;iy intellekt asosida kontent va faoliyatni tekshirish bo&apos;limi.
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Word fayl yuklash</h2>
          <p className="text-sm text-gray-400 mb-4">
            AI tekshiruv uchun `.doc` yoki `.docx` faylni tanlang.
          </p>

          <label
            htmlFor="word-upload-input"
            className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer px-4 py-6"
          >
            <Upload className="h-7 w-7 text-indigo-300" />
            <span className="text-sm sm:text-base text-indigo-200 font-medium">Word faylni tanlash uchun bosing</span>
            <span className="text-xs text-gray-400">Qo&apos;llab-quvvatlanadi: .doc, .docx</span>
          </label>
          <input
            id="word-upload-input"
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleWordFileChange}
            className="hidden"
          />

          <div className="mt-4 p-3 rounded-lg bg-slate-700/40 border border-slate-600">
            {selectedWordFile ? (
              <div className="flex items-center gap-2 text-sm text-green-300">
                <FileText className="h-4 w-4" />
                <span className="break-all">{selectedWordFile.name}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Hozircha fayl tanlanmagan.</p>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!selectedWordFile || uploading}
              onClick={handleUploadAndParse}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold"
            >
              {uploading ? (
                <>
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Yuklash
                </>
              )}
            </button>

            {error && (
              <div className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Ajratilgan savollar ({questions.length})
            </h2>
            <ol className="space-y-3 list-decimal list-inside">
              {questions.map((q) => (
                <li key={q.index} className="rounded-lg border border-gray-700 bg-slate-900/30 p-3 marker:text-indigo-300 marker:font-semibold">
                  <div className="text-sm text-gray-100 leading-7">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {q.ai?.latexText || q.text}
                    </ReactMarkdown>
                  </div>
                  {(q.options?.A || q.options?.B || q.options?.C || q.options?.D) && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-200">
                      {q.options?.A && <div className="rounded border border-slate-700 px-2 py-1">A) {q.options.A}</div>}
                      {q.options?.B && <div className="rounded border border-slate-700 px-2 py-1">B) {q.options.B}</div>}
                      {q.options?.C && <div className="rounded border border-slate-700 px-2 py-1">C) {q.options.C}</div>}
                      {q.options?.D && <div className="rounded border border-slate-700 px-2 py-1">D) {q.options.D}</div>}
                    </div>
                  )}
                  {q.ai && (
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/60 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">AI holat:</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            q.ai.status === 'good'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {q.ai.status === 'good' ? 'Yaxshi' : 'Tuzatish kerak'}
                        </span>
                        {q.source && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                            manba: {q.source === 'image' ? 'rasm' : 'matn'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-400">Sabab:</span> {q.ai.reason}
                      </p>
                      {q.ai.improvedText && q.ai.improvedText !== q.text && (
                        <div>
                          <p className="text-xs text-indigo-300 mb-1">AI taklif qilgan variant:</p>
                          <pre className="text-sm text-indigo-100 whitespace-pre-wrap break-words font-sans">
                            {q.ai.improvedText}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Holat</h2>
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-300">Bo&apos;lim yaratildi va foydalanishga tayyor.</p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Tekshiruvlar</h2>
              <Search className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300">Kelgusida AI orqali avtomatik tekshiruvlar shu yerda ishlaydi.</p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Ogohlantirishlar</h2>
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-sm text-gray-300">Aniqlangan muammolar va xavflar bo&apos;yicha xabarlar ko&apos;rinadi.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
