"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Bubble, { BackBubble } from "@/components/Bubble";

interface BusinessApplication {
  id: number;
  company_name: string;
  vat_number: string;
  kvk_number: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  ownerEmail: string;
  ownerFirstName: string;
}

export default function BusinessApplicationsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/');
      return;
    }
    fetchApplications();
  }, [user, isAdmin, router]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/business-applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        setError('Failed to fetch applications');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (companyId: number, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      const response = await fetch('/api/admin/business-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          status,
          rejectionReason
        }),
      });

      if (response.ok) {
        setApplications(applications.map(app => 
          app.id === companyId 
            ? { ...app, status }
            : app
        ));
      } else {
        setError('Failed to update application status');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (loading) {
    return (
      <div className="bubble-grid">
        <Bubble variant="light" className="col-span-full text-center">
          <div className="text-gray-500">Loading applications...</div>
        </Bubble>
      </div>
    );
  }

  return (
    <div className="bubble-grid">
      <BackBubble href="/" className="absolute top-4 left-4 z-10" />

      <Bubble variant="primary" className="col-span-full">
        <div className="bubble-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <div className="bubble-title">Business Applications</div>
        <div className="bubble-description">Review and approve business account applications</div>
      </Bubble>

      {error && (
        <Bubble variant="warning" className="col-span-full">
          <div className="text-center text-red-600">{error}</div>
        </Bubble>
      )}

      {applications.length === 0 ? (
        <Bubble variant="info" className="col-span-full text-center">
          <div>No pending business applications</div>
        </Bubble>
      ) : (
        applications.map((app) => (
          <Bubble key={app.id} variant={app.status === 'pending' ? 'warning' : app.status === 'approved' ? 'success' : 'secondary'} className="col-span-full">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{app.company_name}</h3>
                  <p className="text-sm opacity-90">Owner: {app.ownerFirstName} ({app.ownerEmail})</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {app.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>KvK Number:</strong> {app.kvk_number}
                </div>
                <div>
                  <strong>VAT Number:</strong> {app.vat_number || 'N/A'}
                </div>
                <div className="col-span-2">
                  <strong>Address:</strong> {app.address}
                </div>
                <div>
                  <strong>Contact:</strong> {app.contact_name}
                </div>
                <div>
                  <strong>Phone:</strong> {app.contact_phone}
                </div>
                <div className="col-span-2">
                  <strong>Email:</strong> {app.contact_email}
                </div>
                <div className="col-span-2">
                  <strong>Applied:</strong> {new Date(app.createdAt).toISOString().split('T')[0]}
                </div>
              </div>

              {app.status === 'pending' && (
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => handleApproval(app.id, 'approved')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        handleApproval(app.id, 'rejected', reason);
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </Bubble>
        ))
      )}
    </div>
  );
}







