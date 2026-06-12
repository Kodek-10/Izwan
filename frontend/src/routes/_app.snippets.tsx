import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

const snippetsSearchSchema = z.object({
  collection: z.number().optional(),
});

export const Route = createFileRoute("/_app/snippets")({
  validateSearch: snippetsSearchSchema,
  component: () => <Outlet />,
});
