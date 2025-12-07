"use client"

import { useState } from "react"
import { Member, MemberFood } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MemberCardProps {
  member: Member
  onDelete: (memberId: string) => void
}

export default function MemberCard({ member, onDelete }: MemberCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(member.id)
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error("Failed to delete member:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">{member.name}</CardTitle>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{calculateAge(member.birth_date)}歳</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">苦手な食べ物</p>
            <div className="flex flex-wrap gap-2">
              {/* TODO: Load member foods from API */}
              <Badge variant="outline" className="text-xs">
                まだ登録されていません
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを削除</DialogTitle>
            <DialogDescription>
              {member.name}さんを削除してもよろしいですか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
