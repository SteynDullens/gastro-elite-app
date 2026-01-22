"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BusinessApplicationsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main admin page with business tab
    router.push('/admin?tab=business');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Doorverwijzen naar admin panel...</p>
      </div>
    </div>
  );
}
