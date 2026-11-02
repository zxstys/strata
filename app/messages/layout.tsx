// app/messages/layout.tsx
import { Suspense } from "react";
import MessagesShell from "./MessagesShell";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      }
    >
      <MessagesShell>{children}</MessagesShell>
    </Suspense>
  );
}