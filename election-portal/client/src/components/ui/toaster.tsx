import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react"

const variantIcon = {
  default: { Icon: Info, color: "text-[rgb(10,36,99)]" },
  success: { Icon: CheckCircle2, color: "text-emerald-600" },
  destructive: { Icon: XCircle, color: "text-red-600" },
  warning: { Icon: AlertTriangle, color: "text-amber-600" },
  info: { Icon: Info, color: "text-sky-600" },
} as const

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const key = (variant ?? "default") as keyof typeof variantIcon
        const { Icon, color } = variantIcon[key] ?? variantIcon.default
        return (
          <Toast key={id} variant={variant} {...props}>
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} aria-hidden="true" />
            <div className="grid flex-1 gap-1">
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
