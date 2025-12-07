"use client"

import { useState } from "react"
import { Member } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  onMemberAdded: (member: Member) => void
}

export default function AddMemberDialog({
  open,
  onOpenChange,
  familyId,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("名前を入力してください")
      return
    }

    if (!birthDate) {
      setError("生年月日を入力してください")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          name,
          birth_date: birthDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create member")
      }

      const newMember = await response.json()
      onMemberAdded(newMember)

      // Reset form
      setName("")
      setBirthDate("")
    } catch (err) {
      setError("メンバーの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>メンバーを追加</DialogTitle>
            <DialogDescription>
              新しい家族メンバーの情報を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                placeholder="例: ゆうと"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">生年月日</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value)
                  setError("")
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
