"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Bubble, { BackBubble } from "@/components/Bubble";

interface BusinessApplication {
  id: string;
  company_name: string;
  vat_number: string;
  kvk_number: string;
  company_phone: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  kvk_document_path: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  approved_at: string | null;
  approved_by: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  createdAt: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
}

export default function BusinessApplicationsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleApproval = async (companyId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    setProcessingId(companyId);
    setError("");
    setSuccessMessage("");
    
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
        const app = applications.find(a => a.id === companyId);
        setApplications(applications.map(app => 
          app.id === companyId 
            ? { 
                ...app, 
                status, 
                rejection_reason: rejectionReason || '',
                approved_at: status === 'approved' ? new Date().toISOString() : null,
                approved_by: user?.email || null
              }
            : app
        ));
        setSuccessMessage(`${app?.company_name} has been ${status}. Email notification sent to ${app?.ownerEmail}.`);
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError('Failed to update application status');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' ? true : app.status === filter
  );

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  if (loading) {
    return (
      <div className="bubble-grid">
        <Bubble variant="light" className="col-span-full text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
            <span className="text-gray-500">Loading applications...</span>
          </div>
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

      {/* Stats and Filter */}
      <div className="col-span-full flex flex-wrap gap-2 justify-center mb-4">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending' 
              ? 'bg-amber-500 text-white' 
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'approved' 
              ? 'bg-green-500 text-white' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'rejected' 
              ? 'bg-red-500 text-white' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All ({applications.length})
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="col-span-full bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      {error && (
        <Bubble variant="warning" className="col-span-full">
          <div className="text-center text-red-600">{error}</div>
        </Bubble>
      )}

      {filteredApplications.length === 0 ? (
        <Bubble variant="info" className="col-span-full text-center">
          <div>No {filter === 'all' ? '' : filter} business applications</div>
        </Bubble>
      ) : (
        filteredApplications.map((app) => (
          <Bubble 
            key={app.id} 
            variant={app.status === 'pending' ? 'warning' : app.status === 'approved' ? 'success' : 'secondary'} 
            className="col-span-full"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{app.company_name}</h3>
                  <p className="text-sm opacity-90">
                    Owner: {app.ownerFirstName} {app.ownerLastName}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {app.status.toUpperCase()}
                  </span>
                  {/* Email verification status */}
                  <span className={`px-2 py-1 rounded text-xs ${
                    app.email_verified 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {app.email_verified ? '✓ Email Verified' : '⏳ Email Not Verified'}
                  </span>
                </div>
              </div>

              {/* Company Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white/50 rounded-lg p-4">
                <div>
                  <span className="font-semibold text-gray-600">KvK Number:</span>
                  <span className="ml-2">{app.kvk_number}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">VAT Number:</span>
                  <span className="ml-2">{app.vat_number || 'N/A'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-600">Address:</span>
                  <span className="ml-2">{app.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Contact Email:</span>
                  <span className="ml-2">{app.contact_email}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Contact Phone:</span>
                  <span className="ml-2">{app.contact_phone || app.company_phone || 'N/A'}</span>
                </div>
              </div>

              {/* KVK Document */}
              {app.kvk_document_path && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-blue-800">KvK Document Uploaded</span>
                    </div>
                    <a 
                      href={app.kvk_document_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      View Document
                    </a>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
                <div>📅 Applied: {new Date(app.createdAt).toLocaleString()}</div>
                {app.email_verified_at && (
                  <div>✉️ Email Verified: {new Date(app.email_verified_at).toLocaleString()}</div>
                )}
                {app.approved_at && (
                  <div>
                    {app.status === 'approved' ? '✅' : '❌'} {app.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(app.approved_at).toLocaleString()}
                    {app.approved_by && <span className="ml-2">by {app.approved_by}</span>}
                  </div>
                )}
                {app.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                    <strong>Rejection Reason:</strong> {app.rejection_reason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {app.status === 'pending' && (
                <div className="flex gap-3 justify-end pt-2 border-t">
                  <button
                    onClick={() => handleApproval(app.id, 'approved')}
                    disabled={processingId === app.id || !app.email_verified}
                    className={`px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center ${
                      (processingId === app.id || !app.email_verified) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={!app.email_verified ? 'Email must be verified first' : ''}
                  >
                    {processingId === app.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      handleApproval(app.id, 'rejected', reason || undefined);
                    }}
                    disabled={processingId === app.id}
                    className={`px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center ${
                      processingId === app.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              )}

              {/* Warning if email not verified */}
              {app.status === 'pending' && !app.email_verified && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-amber-800 text-sm">
                  ⚠️ Cannot approve until the owner verifies their email address.
                </div>
              )}
            </div>
          </Bubble>
        ))
      )}
    </div>
  );
}







