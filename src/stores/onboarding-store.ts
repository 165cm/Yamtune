import { create } from "zustand"

interface OnboardingState {
  currentStep: number
  totalSteps: number
  isCompleted: boolean
  familyData: {
    name?: string
  }
  memberData: {
    name?: string
    birthDate?: string
    likes?: string[]
    dislikes?: string[]
    allergies?: string[]
  }
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setFamilyData: (data: Partial<OnboardingState["familyData"]>) => void
  setMemberData: (data: Partial<OnboardingState["memberData"]>) => void
  completeOnboarding: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  totalSteps: 4,
  isCompleted: false,
  familyData: { name: "マイファミリー" },
  memberData: {
    likes: [],
    dislikes: [],
    allergies: [],
  },
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps),
    })),
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),
  setFamilyData: (data) =>
    set((state) => ({
      familyData: { ...state.familyData, ...data },
    })),
  setMemberData: (data) =>
    set((state) => ({
      memberData: { ...state.memberData, ...data },
    })),
  completeOnboarding: () => set({ isCompleted: true }),
  reset: () =>
    set({
      currentStep: 1,
      isCompleted: false,
      familyData: {},
      memberData: { likes: [], dislikes: [], allergies: [] },
    }),
}))
