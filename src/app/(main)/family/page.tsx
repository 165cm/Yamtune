"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { useFamilyStore } from "@/stores/family-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowLeft } from "lucide-react"
import MemberCard from "@/components/features/family/member-card"
import AddMemberDialog from "@/components/features/family/add-member-dialog"
import { Member } from "@/types"

export default function FamilyPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { currentFamily, members, setCurrentFamily, setMembers } = useFamilyStore()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    const loadFamilyData = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        // Load family
        const familyRes = await fetch("/api/families")
        if (familyRes.ok) {
          const families = await familyRes.json()
          if (families.length > 0) {
            const family = families[0]
            setCurrentFamily(family)

            // Load members
            const membersRes = await fetch(`/api/members?family_id=${family.id}`)
            if (membersRes.ok) {
              const membersData = await membersRes.json()
              setMembers(membersData)
            }
          }
        }
      } catch (error) {
        console.error("Failed to load family data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFamilyData()
  }, [user, router, setCurrentFamily, setMembers])

  const handleMemberAdded = (newMember: Member) => {
    setMembers([...members, newMember])
    setIsAddDialogOpen(false)
  }

  const handleMemberDeleted = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">家族管理</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>家族メンバー</CardTitle>
                <CardDescription>
                  お子様の情報と好き嫌いを管理します
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                メンバー追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  まだメンバーが登録されていません
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  最初のメンバーを追加
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onDelete={handleMemberDeleted}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddMemberDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        familyId={currentFamily?.id || ""}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  )
}
