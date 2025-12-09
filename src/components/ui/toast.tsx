"use client"

import { useToastStore, ToastType } from "@/stores/toast-store"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
}

const bgMap: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
  warning: "bg-yellow-50 border-yellow-200",
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300",
            bgMap[toast.type]
          )}
        >
          {iconMap[toast.type]}
          <p className="flex-1 text-sm font-medium text-gray-900">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
