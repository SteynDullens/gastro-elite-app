"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Bubble, { BackBubble } from "@/components/Bubble";

interface Company {
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
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}

export default function CompanyDashboard() {
  const { user, isBusiness } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCompanyData = useCallback(async () => {
    if (!user?.companyId) return;
    const companyId = user.companyId;

    try {
      const [companyResponse, employeesResponse] = await Promise.all([
        fetch(`/api/company/${companyId}`),
        fetch(`/api/company/${companyId}/employees`)
      ]);

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData);
      }

      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.employees);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    if (isBusiness && user?.companyId) {
      fetchCompanyData();
    }
  }, [isBusiness, user?.companyId, fetchCompanyData]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!employeeEmail) {
      setError("Voer een e-mailadres in");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeEmail)) {
      setError("Voer een geldig e-mailadres in");
      return;
    }

    try {
      const response = await fetch(`/api/company/${user?.companyId}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: employeeEmail,
          language: 'nl' // Default to Dutch, can be enhanced with language context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.userExists 
          ? "Uitnodiging succesvol verzonden naar bestaande gebruiker!" 
          : "Registratie-uitnodiging succesvol verzonden!");
        setEmployeeEmail("");
        setShowAddEmployee(false);
        fetchCompanyData(); // Refresh employee list
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || "Uitnodiging verzenden mislukt");
      }
    } catch (error) {
      setError("Uitnodiging verzenden mislukt");
    }
  };

  const handleRemoveEmployee = async (employeeId: number) => {
    try {
      const response = await fetch(`/api/company/${user?.companyId}/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess("Employee removed successfully!");
        fetchCompanyData(); // Refresh employee list
      } else {
        setError("Medewerker verwijderen mislukt");
      }
    } catch (error) {
      setError("Medewerker verwijderen mislukt");
    }
  };

  if (!isBusiness) {
    return (
      <div className="bubble-grid">
        <BackBubble href="/" className="absolute top-4 left-4 z-10" />
        <Bubble variant="warning" className="col-span-full text-center">
          <div className="bubble-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          <div className="bubble-title">Access Restricted</div>
          <div className="bubble-description">This page is only accessible to business accounts</div>
        </Bubble>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bubble-grid">
        <BackBubble href="/" className="absolute top-4 left-4 z-10" />
        <Bubble variant="light" className="col-span-full text-center">
          <div className="text-gray-500">Loading company information...</div>
        </Bubble>
      </div>
    );
  }

  return (
    <div className="bubble-grid">
      <BackBubble href="/" className="absolute top-4 left-4 z-10" />

      {/* Company Information */}
      <Bubble variant="primary" className="col-span-full">
        <div className="bubble-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        </div>
        <div className="bubble-title">{company?.company_name}</div>
        <div className="bubble-description">
          Status: <span className={`font-semibold ${
            company?.status === 'approved' ? 'text-green-600' :
            company?.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {company?.status?.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <strong>KvK Number:</strong> {company?.kvk_number}
          </div>
          <div>
            <strong>Contact:</strong> {company?.contact_name}
          </div>
          <div>
            <strong>Phone:</strong> {company?.contact_phone}
          </div>
          <div>
            <strong>Email:</strong> {company?.contact_email}
          </div>
        </div>
        
        <div className="mt-4">
          <strong>Address:</strong>
          <div className="text-sm mt-1">{company?.address}</div>
        </div>
      </Bubble>

      {/* Statistics */}
      <Bubble variant="info">
        <div className="bubble-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <div className="bubble-title">Total Recipes</div>
        <div className="text-3xl font-bold">0</div>
      </Bubble>

      <Bubble variant="success">
        <div className="bubble-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46a1.5 1.5 0 0 0-1.42 1.37L1.5 16H4v6h2v-6h2.5l2.54 7.63A1.5 1.5 0 0 0 12.54 20H16c.8 0 1.54-.37 2.01-.99L20 17l1.99 2.01A2.5 2.5 0 0 0 24 20h-2v6h-2z"/>
          </svg>
        </div>
        <div className="bubble-title">Employees</div>
        <div className="text-3xl font-bold">{employees.length}</div>
      </Bubble>

      {/* Employee Management */}
      <Bubble variant="light" className="col-span-full">
        <div className="bubble-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46a1.5 1.5 0 0 0-1.42 1.37L1.5 16H4v6h2v-6h2.5l2.54 7.63A1.5 1.5 0 0 0 12.54 20H16c.8 0 1.54-.37 2.01-.99L20 17l1.99 2.01A2.5 2.5 0 0 0 24 20h-2v6h-2z"/>
          </svg>
        </div>
        <div className="bubble-title">Employee Management</div>
        
        <button
          onClick={() => setShowAddEmployee(!showAddEmployee)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add Employee
        </button>

        {showAddEmployee && (
          <form onSubmit={handleAddEmployee} className="mt-4 space-y-4">
            <div>
              <label htmlFor="employeeEmail" className="block text-sm font-medium mb-2">
                Employee Email
              </label>
              <input
                type="email"
                id="employeeEmail"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
                placeholder="Voer medewerker e-mailadres in"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Send Invitation
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 text-red-200 text-sm text-center bg-red-500/20 rounded-lg p-3">{error}</div>
        )}

        {success && (
          <div className="mt-4 text-green-200 text-sm text-center bg-green-500/20 rounded-lg p-3">{success}</div>
        )}

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Current Employees</h4>
          {employees.length === 0 ? (
            <div className="text-gray-500 text-sm">No employees yet</div>
          ) : (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div key={employee.id} className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <div>
                    <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                    <div className="text-sm text-gray-300">{employee.email}</div>
                    <div className={`text-xs ${
                      employee.status === 'accepted' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {employee.status === 'accepted' ? 'Active' : 'Pending'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveEmployee(employee.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Bubble>
    </div>
  );
}



