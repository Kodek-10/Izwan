import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    // Only redirect if we are on the client and NOT authenticated
    if (typeof window !== "undefined" && !api.isAuthenticated()) {
      throw redirect({ 
        to: "/auth",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AppRouteComponent,
});

function AppRouteComponent() {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("izwan-onboarded") !== "1") {
      setShowOnboarding(true);
    }
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem("izwan-onboarded", "1");
    setShowOnboarding(false);
  };

  return (
    <AppShell>
      <OnboardingDialog open={showOnboarding} onClose={finishOnboarding} />
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="h-full"
      >
        <Outlet />
      </motion.div>
    </AppShell>
  );
}
