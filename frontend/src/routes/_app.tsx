import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

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
  
  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 10, scale: 0.99 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.99 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for smooth motion
          }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
