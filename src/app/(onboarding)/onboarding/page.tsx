"use client"

import { useOnboardingStore } from "@/stores/onboarding-store"
import { Progress } from "@/components/ui/progress"
import WelcomeStep from "@/components/features/onboarding/welcome-step"
import ScanDemoStep from "@/components/features/onboarding/scan-demo-step"
import RecipeDemoStep from "@/components/features/onboarding/recipe-demo-step"
import MemberInfoStep from "@/components/features/onboarding/member-info-step"

export default function OnboardingPage() {
  const { currentStep, totalSteps } = useOnboardingStore()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <ScanDemoStep />
      case 3:
        return <MemberInfoStep />
      case 4:
        return <RecipeDemoStep />
      default:
        return <WelcomeStep />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              ステップ {currentStep} / {totalSteps}
            </h2>
            <span className="text-sm font-medium text-primary">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} />
        </div>

        {renderStep()}
      </div>
    </div>
  )
}
