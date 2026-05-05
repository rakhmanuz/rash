'use client'

export default function StudentOfflineError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
      <h2 className="text-lg font-semibold">Offline modulda xatolik yuz berdi</h2>
      <p className="mt-2 text-sm text-red-200">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-md border border-red-400/40 px-3 py-2 text-sm"
      >
        Qayta urinish
      </button>
    </div>
  )
}

