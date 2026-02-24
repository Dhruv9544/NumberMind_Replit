import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive"
        const isSuccess = !isDestructive && title && (
          String(title).toLowerCase().includes("success") ||
          String(title).toLowerCase().includes("granted") ||
          String(title).toLowerCase().includes("created") ||
          String(title).toLowerCase().includes("saved") ||
          String(title).toLowerCase().includes("sent") ||
          String(title).toLowerCase().includes("accepted")
        )

        const Icon = isDestructive ? AlertTriangle : isSuccess ? CheckCircle2 : Info
        const iconColor = isDestructive
          ? "text-red-400"
          : isSuccess
          ? "text-emerald-400"
          : "text-blue-400"
        const accentBg = isDestructive
          ? "bg-red-500"
          : isSuccess
          ? "bg-emerald-500"
          : "bg-blue-500"

        return (
          <Toast key={id} variant={variant as any} {...props}>
            {/* Left accent bar */}
            <div className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-full", accentBg)} />

            {/* Icon */}
            <div className={cn("mt-0.5 flex-shrink-0 pl-1", iconColor)}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pl-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>

            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
