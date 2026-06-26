"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium",
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      )}
    >
      {message}
    </div>
  )
}

export { Toast }
