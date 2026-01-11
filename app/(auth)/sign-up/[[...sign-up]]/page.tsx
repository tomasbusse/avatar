import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFE8CD]">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white border border-[#E3C6AB] shadow-lg rounded-lg",
            headerTitle: "text-[#003F37] font-bold",
            headerSubtitle: "text-[#4F5338]",
            socialButtonsBlockButton:
              "border-[#E3C6AB] hover:bg-[#FFE8CD] text-[#003F37]",
            socialButtonsBlockButtonText: "text-[#003F37] font-medium",
            formButtonPrimary:
              "bg-[#003F37] hover:bg-[#004d42] text-white font-medium",
            footerActionLink: "text-[#B25627] hover:text-[#003F37]",
            formFieldInput:
              "border-[#E3C6AB] focus:border-[#003F37] focus:ring-[#003F37]",
            formFieldLabel: "text-[#4F5338]",
            identityPreviewEditButton: "text-[#B25627] hover:text-[#003F37]",
            formResendCodeLink: "text-[#B25627] hover:text-[#003F37]",
            otpCodeFieldInput: "border-[#E3C6AB] focus:border-[#003F37]",
            dividerLine: "bg-[#E3C6AB]",
            dividerText: "text-[#4F5338]",
          },
          variables: {
            colorPrimary: "#003F37",
            colorText: "#1A1A1A",
            colorTextSecondary: "#4F5338",
            colorBackground: "#FFFFFF",
            colorInputBackground: "#FFFFFF",
            colorInputText: "#1A1A1A",
            colorDanger: "#B25627",
          },
        }}
        afterSignUpUrl="/onboarding"
        signInUrl="/sign-in"
      />
    </div>
  );
}
