"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminPanel from "@/components/AdminPanel";

function AdminPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';
  
  return (
    <div className="space-y-6">
      <AdminPanel initialTab={tab as 'dashboard' | 'users' | 'business' | 'logs' | 'backup' | 'recovery'} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Laden...</p>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}

