import { create } from "zustand"
import { Family, Member } from "@/types"

interface FamilyState {
  currentFamily: Family | null
  members: Member[]
  selectedMember: Member | null
  setCurrentFamily: (family: Family | null) => void
  setMembers: (members: Member[]) => void
  setSelectedMember: (member: Member | null) => void
}

export const useFamilyStore = create<FamilyState>((set) => ({
  currentFamily: null,
  members: [],
  selectedMember: null,
  setCurrentFamily: (family) => set({ currentFamily: family }),
  setMembers: (members) => set({ members }),
  setSelectedMember: (member) => set({ selectedMember: member }),
}))
