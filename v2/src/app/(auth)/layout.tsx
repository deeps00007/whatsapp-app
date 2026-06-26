import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthBrandReveal } from "@/components/auth/AuthBrandReveal";
import { AuthLogo } from "@/components/auth/AuthLogo";

// Shared metadata for auth pages (login / signup / forgot-password).
// None of these should be indexed — they'd compete with the marketing
// landing in SERPs and offer nothing to a searcher who hasn't already
// signed up. Each page still gets its own <title> via its own
// metadata.title override below the route group layout.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen w-full bg-white text-slate-900 font-sans overflow-hidden">
      {/* Left side: branding & form */}
      <div className="flex flex-col h-screen relative px-6 py-4 md:px-12 md:py-6 justify-between overflow-y-auto">
        {/* Top Branding Section */}
        <div className="flex items-center gap-2 shrink-0">
          <AuthLogo className="text-[#34d399]" size={36} />
        </div>

        {/* Form Container */}
        <div className="my-auto w-full max-w-md mx-auto py-4">
          {children}
        </div>

        {/* Footer spacer */}
        <div className="hidden md:block h-2 shrink-0" />
      </div>

      {/* Right side: brand reveal animation */}
      <div className="hidden md:block relative h-screen w-full overflow-hidden">
        <AuthBrandReveal />
      </div>
    </div>
  );
}
