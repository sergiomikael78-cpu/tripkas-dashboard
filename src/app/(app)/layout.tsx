import { Shell } from "@/components/layout/Shell"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { useWorkspace } from "@/hooks/useWorkspace"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <Shell>
        {children}
      </Shell>
    </AuthProvider>
  )
}
