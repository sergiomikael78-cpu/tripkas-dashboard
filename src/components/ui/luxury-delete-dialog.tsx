'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"

interface LuxuryDeleteDialogProps {
  title?: string
  description?: string
  onConfirm: () => Promise<void>
  trigger?: React.ReactNode
}

export function LuxuryDeleteDialog({
  title = "Hapus Data?",
  description = "Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.",
  onConfirm,
  trigger
}: LuxuryDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsDeleting(true)
      await onConfirm()
      setOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          trigger ? (trigger as React.ReactElement) : (
            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-zinc-950 border-zinc-800 shadow-2xl shadow-red-900/20">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
        
        <div className="p-8 relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20 opacity-75 duration-1000" />
            <AlertTriangle className="h-8 w-8 text-red-500 relative z-10" />
          </div>
          
          <DialogTitle className="text-2xl font-bold text-zinc-100 mb-3">{title}</DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm max-w-[280px]">
            {description}
          </DialogDescription>
        </div>

        <DialogFooter className="bg-zinc-900/80 p-4 flex gap-3 sm:justify-between border-t border-zinc-800">
          <DialogClose 
            render={<Button variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" disabled={isDeleting} />}
          >
            Batal
          </DialogClose>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-600/20 transition-all"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? "Menghapus..." : "Ya, Hapus!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
