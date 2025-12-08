"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Camera, Loader2 } from "lucide-react"

interface CookingLogDialogProps {
  recipeId: string
  recipeTitle: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CookingLogDialog({
  recipeId,
  recipeTitle,
  onSuccess,
  trigger,
}: CookingLogDialogProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/cooking-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          notes,
          rating: rating > 0 ? rating : undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to create cooking log")

      // 成功したらダイアログを閉じる
      setOpen(false)
      setNotes("")
      setRating(0)

      // コールバックを実行
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating cooking log:", error)
      alert("調理記録の保存に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Camera className="w-4 h-4" />
            調理記録
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>調理記録を追加</DialogTitle>
          <DialogDescription>{recipeTitle}を作りました！</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 評価 */}
          <div className="space-y-2">
            <Label>評価（任意）</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="notes">メモ（任意）</Label>
            <Textarea
              id="notes"
              placeholder="作ってみた感想や、子どもの反応など..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* 将来的に画像アップロード機能を追加できる */}
          {/* <div className="space-y-2">
            <Label>写真を追加（準備中）</Label>
            <Button variant="outline" disabled className="w-full gap-2">
              <Camera className="w-4 h-4" />
              写真を選択
            </Button>
          </div> */}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "記録する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
