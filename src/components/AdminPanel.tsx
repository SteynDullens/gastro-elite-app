"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface ErrorLog {
  id: number;
  level: string;
  message: string;
  stack?: string;
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  createdAt: string;
}

interface User {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  account_type: string;
  isActive: boolean;
  emailVerified: boolean;
  companyName?: string;
  companyStatus?: string | null; // pending, approved, rejected
  createdAt: string;
  updatedAt: string;
}

interface AdminPanelProps {
  initialTab?: 'users' | 'business' | 'logs';
}

export default function AdminPanel({ initialTab = 'users' }: AdminPanelProps = {}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'business' | 'logs'>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [businessApplications, setBusinessApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [businessFilter, setBusinessFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchErrorLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/error-logs", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setErrorLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch error logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/business-applications", {
        credentials: "include",
      });
      const data = await response.json();
      setBusinessApplications(data);
    } catch (error) {
      console.error("Failed to fetch business applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string | number, action: string, data?: any) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId, action, data }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage(`User ${action} successful`);
        fetchUsers();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`Error: ${result.error}`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Network error");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const resetPassword = async (userId: string | number, userEmail: string, firstName: string, lastName: string) => {
    // Confirm action
    if (!confirm(`Weet je zeker dat je het wachtwoord wilt resetten voor ${userEmail}? Er wordt automatisch een nieuw wachtwoord gegenereerd en per email verzonden.`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          userId, 
          action: "reset_password", 
          data: { 
            generatePassword: true, // Signal to generate password automatically
            sendEmail: true,
            userEmail,
            firstName,
            lastName
          } 
        }),
      });

      const result = await response.json();
      console.log('Password reset response:', result);
      
      if (result.success) {
        if (result.emailSent) {
          let message = `✅ Wachtwoord gereset voor ${userEmail}. Een nieuw wachtwoord is gegenereerd en per email verzonden naar ${userEmail}.`;
          if (result.emailDetails) {
            message += `\n\n⚠️ Let op: ${result.emailDetails.suggestion}`;
          } else {
            message += `\n\n💡 Tip: Controleer ook je spam folder als je de email niet ziet.`;
          }
          setMessage(message);
        } else {
          const errorMsg = result.emailError || 'Onbekende email fout';
          let message = `⚠️ Wachtwoord gereset voor ${userEmail}, maar email kon niet worden verzonden.\n\nFout: ${errorMsg}`;
          if (result.emailDetails) {
            message += `\n\n${result.emailDetails.suggestion}`;
          } else {
            message += `\n\nControleer de Vercel logs voor meer details.`;
          }
          setMessage(message);
        }
        fetchUsers();
        setTimeout(() => setMessage(""), 12000);
      } else {
        setMessage(`❌ Fout: ${result.error || 'Onbekende fout'}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      setMessage("Netwerk fout bij resetten van wachtwoord");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const deleteUser = async (userId: string | number, userEmail: string) => {
    if (!confirm(`Weet je zeker dat je het account van ${userEmail} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/delete-user?id=${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();
      if (result.success) {
        setMessage(`Account ${userEmail} succesvol verwijderd`);
        fetchUsers();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`Fout: ${result.error}`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Netwerk fout bij verwijderen");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
      fetchErrorLogs();
      fetchBusinessApplications();
    }
  }, [user]);

  // Update tab when initialTab prop changes
  useEffect(() => {
    if (initialTab && ['users', 'business', 'logs'].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">Access Denied</div>
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/check-email-config', {
                  credentials: 'include'
                });
                const result = await response.json();
                if (result.success) {
                  const configInfo = `Email Configuratie:\n\n` +
                    `SMTP Host: ${result.config.SMTP_HOST}\n` +
                    `SMTP Port: ${result.config.SMTP_PORT}\n` +
                    `SMTP User: ${result.config.SMTP_USER}\n` +
                    `SMTP Pass: ${result.config.SMTP_PASS}\n` +
                    `Admin Email: ${result.config.ADMIN_EMAIL}\n` +
                    `App URL: ${result.config.APP_URL}\n\n` +
                    (result.warnings.length > 0 ? `⚠️ Waarschuwingen:\n${result.warnings.join('\n')}` : '✅ Geen waarschuwingen - alle configuratie is ingesteld');
                  alert(configInfo);
                } else {
                  alert(`❌ Fout bij ophalen configuratie: ${result.error}`);
                }
              } catch (error: any) {
                alert(`❌ Fout bij ophalen email configuratie: ${error.message || 'Onbekende fout'}`);
              }
            }}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Check email configuratie"
          >
            📧 Check Email Config
          </button>
          <div className="text-sm text-gray-500">
            Welcome, {user.firstName} {user.lastName}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${
          message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            style={{
              borderBottomColor: activeTab === "users" ? '#FF8C00' : 'transparent'
            }}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "business"
                ? "text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            style={{
              borderBottomColor: activeTab === "business" ? '#FF8C00' : 'transparent'
            }}
          >
            Business Applications ({businessApplications.filter(app => app.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "logs"
                ? "text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            style={{
              borderBottomColor: activeTab === "logs" ? '#FF8C00' : 'transparent'
            }}
          >
            Error Logs ({errorLogs.length})
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.companyName && (
                          <div className="text-xs text-blue-600">{user.companyName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.account_type === 'admin' ? 'bg-red-100 text-red-800' :
                        user.account_type === 'business' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        // Determine status based on email verification and company approval
                        let statusText = '';
                        let statusClass = '';
                        
                        if (!user.emailVerified) {
                          statusText = 'Email nog niet geverifieerd';
                          statusClass = 'bg-yellow-100 text-yellow-800';
                        } else if (user.account_type === 'business' && user.companyStatus === 'pending') {
                          statusText = 'Wachten op goedkeuring';
                          statusClass = 'bg-amber-100 text-amber-800';
                        } else if (user.account_type === 'business' && user.companyStatus === 'rejected') {
                          statusText = 'Afgewezen';
                          statusClass = 'bg-red-100 text-red-800';
                        } else if (user.account_type === 'business' && user.companyStatus === 'approved') {
                          statusText = 'Goedgekeurd';
                          statusClass = 'bg-green-100 text-green-800';
                        } else if (!user.isActive) {
                          statusText = 'Inactive';
                          statusClass = 'bg-red-100 text-red-800';
                        } else {
                          statusText = 'Active';
                          statusClass = 'bg-green-100 text-green-800';
                        }
                        
                        return (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleUserAction(user.id, "toggle_active")}
                        className={`px-3 py-1 rounded text-xs ${
                          user.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => resetPassword(user.id, user.email, user.firstName, user.lastName)}
                        className="px-3 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: '#FF8C00' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
                      >
                        Reset Wachtwoord
                      </button>
                      <select
                        value={user.account_type}
                        onChange={(e) => handleUserAction(user.id, "change_role", { newRole: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="user">User</option>
                        <option value="business">Business</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => deleteUser(user.id, user.email)}
                        className="px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                      >
                        Verwijder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Business Applications Tab */}
      {activeTab === "business" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Business Applications</h2>
            </div>
            
            {/* Filter Buttons */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setBusinessFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    businessFilter === 'pending' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  Pending ({businessApplications.filter(a => a.status === 'pending').length})
                </button>
                <button
                  onClick={() => setBusinessFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    businessFilter === 'approved' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  Approved ({businessApplications.filter(a => a.status === 'approved').length})
                </button>
                <button
                  onClick={() => setBusinessFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    businessFilter === 'rejected' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  Rejected ({businessApplications.filter(a => a.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setBusinessFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    businessFilter === 'all' 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  All ({businessApplications.length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {businessApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Geen bedrijfsaanvragen gevonden
                </div>
              ) : (
                <div className="space-y-4">
                  {businessApplications
                    .filter(app => businessFilter === 'all' ? true : app.status === businessFilter)
                    .map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{app.company_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Eigenaar: {app.ownerFirstName} {app.ownerLastName} ({app.ownerEmail})
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
                            {app.email_verified ? '✓ Email Geverifieerd' : '⏳ Email Niet Geverifieerd'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 bg-gray-50 rounded-lg p-4">
                        <div>
                          <strong className="text-gray-600">KvK Nummer:</strong>
                          <span className="ml-2">{app.kvk_number}</span>
                        </div>
                        <div>
                          <strong className="text-gray-600">BTW Nummer:</strong>
                          <span className="ml-2">{app.vat_number || 'N/A'}</span>
                        </div>
                        <div className="md:col-span-2">
                          <strong className="text-gray-600">Adres:</strong>
                          <span className="ml-2">{app.address || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-gray-600">Contact Email:</strong>
                          <span className="ml-2">{app.contact_email}</span>
                        </div>
                        <div>
                          <strong className="text-gray-600">Telefoon:</strong>
                          <span className="ml-2">{app.contact_phone || app.company_phone || 'N/A'}</span>
                        </div>
                        <div className="md:col-span-2">
                          <strong className="text-gray-600">Aangemeld op:</strong>
                          <span className="ml-2">{new Date(app.createdAt).toLocaleString('nl-NL')}</span>
                        </div>
                        {app.email_verified_at && (
                          <div className="md:col-span-2">
                            <strong className="text-gray-600">Email geverifieerd op:</strong>
                            <span className="ml-2">{new Date(app.email_verified_at).toLocaleString('nl-NL')}</span>
                          </div>
                        )}
                        {app.approved_at && (
                          <div className="md:col-span-2">
                            <strong className="text-gray-600">
                              {app.status === 'approved' ? 'Goedgekeurd' : 'Afgewezen'} op:
                            </strong>
                            <span className="ml-2">{new Date(app.approved_at).toLocaleString('nl-NL')}</span>
                            {app.approved_by && <span className="ml-2 text-gray-500">door {app.approved_by}</span>}
                          </div>
                        )}
                        {app.rejection_reason && (
                          <div className="md:col-span-2 mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                            <strong>Afwijzingsreden:</strong> {app.rejection_reason}
                          </div>
                        )}
                      </div>

                      {/* KVK Document Viewer */}
                      {(app.kvk_document_path || app.kvk_document_data) && (
                        <div className="mb-4">
                          <strong className="text-gray-700 block mb-2">KvK Document:</strong>
                          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                            {(app.kvk_document_data && app.kvk_document_data.startsWith('data:')) ? (
                              <div className="space-y-2">
                                {app.kvk_document_data.includes('pdf') ? (
                                  <iframe 
                                    src={app.kvk_document_data} 
                                    className="w-full border border-gray-300 rounded"
                                    style={{ height: '500px' }}
                                    title="KvK Document"
                                  />
                                ) : (
                                  <img 
                                    src={app.kvk_document_data} 
                                    alt="KvK Document" 
                                    className="max-w-full h-auto border border-gray-300 rounded mx-auto"
                                    style={{ maxHeight: '500px' }}
                                  />
                                )}
                                <div className="text-center">
                                  <a 
                                    href={app.kvk_document_data} 
                                    download={`kvk-${app.kvk_number}.${app.kvk_document_data.includes('pdf') ? 'pdf' : app.kvk_document_data.includes('png') ? 'png' : 'jpg'}`}
                                    className="text-blue-600 hover:underline text-sm inline-block"
                                  >
                                    📥 Download Document
                                  </a>
                                </div>
                              </div>
                            ) : app.kvk_document_path ? (
                              <div className="space-y-2">
                                <div className="text-center mb-2">
                                  <a 
                                    href={app.kvk_document_path} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm inline-block"
                                  >
                                    🔗 Bekijk KvK Document in nieuw tabblad ↗
                                  </a>
                                </div>
                                {app.kvk_document_path.includes('.pdf') || app.kvk_document_path.includes('blob') ? (
                                  <iframe 
                                    src={app.kvk_document_path} 
                                    className="w-full border border-gray-300 rounded"
                                    style={{ height: '500px' }}
                                    title="KvK Document"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <img 
                                      src={app.kvk_document_path} 
                                      alt="KvK Document" 
                                      className="max-w-full h-auto border border-gray-300 rounded mx-auto"
                                      style={{ maxHeight: '500px' }}
                                    />
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Warning if email not verified */}
                      {app.status === 'pending' && !app.email_verified && (
                        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 text-amber-800 text-sm">
                          ⚠️ Kan niet goedkeuren: de eigenaar moet eerst zijn e-mailadres verifiëren.
                        </div>
                      )}

                      {/* Action Buttons */}
                      {app.status === 'pending' && (
                        <div className="flex gap-3 justify-end pt-2 border-t">
                          <button
                            onClick={async () => {
                              setProcessingId(app.id);
                              setMessage("");
                              try {
                                const response = await fetch('/api/admin/business-applications', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ companyId: app.id, status: 'approved' })
                                });
                                if (response.ok) {
                                  setMessage(`Aanvraag van ${app.company_name} goedgekeurd. Email notificatie verzonden naar ${app.ownerEmail}.`);
                                  fetchBusinessApplications();
                                  setTimeout(() => setMessage(""), 5000);
                                } else {
                                  const errorData = await response.json();
                                  setMessage(`Fout: ${errorData.message || 'Kon aanvraag niet goedkeuren'}`);
                                  setTimeout(() => setMessage(""), 5000);
                                }
                              } catch (error) {
                                setMessage('Netwerk fout bij goedkeuren');
                                setTimeout(() => setMessage(""), 5000);
                              } finally {
                                setProcessingId(null);
                              }
                            }}
                            disabled={processingId === app.id || !app.email_verified}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
                              (processingId === app.id || !app.email_verified) 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            title={!app.email_verified ? 'Email moet eerst geverifieerd worden' : ''}
                          >
                            {processingId === app.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Verwerken...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Goedkeuren
                              </>
                            )}
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt('Reden voor afwijzing (optioneel):');
                              if (reason !== null) {
                                setProcessingId(app.id);
                                setMessage("");
                                try {
                                  const response = await fetch('/api/admin/business-applications', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ companyId: app.id, status: 'rejected', rejectionReason: reason || undefined })
                                  });
                                  if (response.ok) {
                                    setMessage(`Aanvraag van ${app.company_name} afgewezen. Email notificatie verzonden naar ${app.ownerEmail}.`);
                                    fetchBusinessApplications();
                                    setTimeout(() => setMessage(""), 5000);
                                  } else {
                                    const errorData = await response.json();
                                    setMessage(`Fout: ${errorData.message || 'Kon aanvraag niet afwijzen'}`);
                                    setTimeout(() => setMessage(""), 5000);
                                  }
                                } catch (error) {
                                  setMessage('Netwerk fout bij afwijzen');
                                  setTimeout(() => setMessage(""), 5000);
                                } finally {
                                  setProcessingId(null);
                                }
                              }
                            }}
                            disabled={processingId === app.id}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
                              processingId === app.id 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Afwijzen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Error Logs</h2>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errorLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        log.level === 'error' ? 'bg-red-100 text-red-800' :
                        log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.message}
                      </div>
                      {log.url && (
                        <div className="text-xs text-gray-500">
                          {log.method} {log.url}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.userEmail || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').split('.')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
    </div>
  );
}
