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
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  account_type: string;
  isActive: boolean;
  emailVerified: boolean;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [businessApplications, setBusinessApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleUserAction = async (userId: number, action: string, data?: any) => {
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

  const resetPassword = (userId: number) => {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (newPassword && newPassword.length >= 6) {
      handleUserAction(userId, "reset_password", { newPassword });
    } else if (newPassword) {
      alert("Password must be at least 6 characters long");
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
      fetchErrorLogs();
      fetchBusinessApplications();
    }
  }, [user]);

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
        <div className="text-sm text-gray-500">
          Welcome, {user.firstName} {user.lastName}
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
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
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
                        onClick={() => resetPassword(user.id)}
                        className="px-3 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: '#FF8C00' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc7000'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
                      >
                        Reset Password
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
            <div className="p-6">
              {businessApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No business applications found
                </div>
              ) : (
                <div className="space-y-4">
                  {businessApplications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{app.company_name}</h3>
                          <p className="text-sm text-gray-600">
                            Owner: {app.ownerFirstName} ({app.ownerEmail})
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/admin/business-applications', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ companyId: app.id, status: 'approved' })
                                });
                                if (response.ok) {
                                  setMessage('Application approved successfully');
                                  fetchBusinessApplications();
                                }
                              } catch (error) {
                                setMessage('Error approving application');
                              }
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) {
                                try {
                                  const response = await fetch('/api/admin/business-applications', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ companyId: app.id, status: 'rejected', rejectionReason: reason })
                                  });
                                  if (response.ok) {
                                    setMessage('Application rejected successfully');
                                    fetchBusinessApplications();
                                  }
                                } catch (error) {
                                  setMessage('Error rejecting application');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Reject
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
