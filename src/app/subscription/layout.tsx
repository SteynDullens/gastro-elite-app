import { Suspense } from "react";

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-600">Laden…</div>}>
      {children}
    </Suspense>
  );
}
