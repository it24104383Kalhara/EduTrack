import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Search, Download, TrendingUp, Mail, AlertTriangle, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { emailAlertsApi } from '../services/api';

interface EmailLog {
  id: number;
  mark_id: number;
  student_id: number;
  parent_email: string;
  email_type: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
  student_name: string;
  student_class?: string;
  grade_name?: string;
  failed_subjects_count?: number;
  exam_type?: string;
}

const EmailAlertLogs: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState<any>(null);

  const fetchLogs = async (page: number = 1, status: string = 'all', search: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 20,
        status,
        student_name: search
      };

      console.log('Fetching email logs and statistics...', params);
      
      // Fetch both logs and statistics in parallel for a true refresh
      const [logsData, statsData] = await Promise.all([
        emailAlertsApi.getLogs(params),
        emailAlertsApi.getStatistics()
      ]);

      if (logsData) {
        setLogs(logsData.logs);
        setCurrentPage(logsData.pagination.current_page);
        setTotalPages(logsData.pagination.total_pages);
        setTotal(logsData.pagination.total);
        
        if (statsData) {
           // Mapping statistics from backend response structure
           setStatistics({
             total_sent: statsData.summary?.total_sent || 0,
             total_failed: statsData.summary?.total_failed || 0,
             success_rate: statsData.summary?.success_rate || 0,
             total_students: statsData.summary?.total_students || 0
           });
        }
      } else {
        setError('Failed to fetch email logs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch email logs');
      console.error('Error fetching email data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200 shadow-sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent Successfully
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200 shadow-sm">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200 shadow-sm">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page, statusFilter, searchTerm);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchLogs(1, status, searchTerm);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchLogs(1, statusFilter, searchTerm);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
    fetchLogs(1, 'all', '');
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;

    // Add title
    doc.setFontSize(20);
    doc.text('Email Alert Logs', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Define table headers and data
    const headers = [['Student Name', 'Student ID', 'Class', 'Parent Email', 'Failed Subjects', 'Status', 'Sent Date & Time']];
    const data = logs.map(log => [
      log.student_name,
      String(log.student_id),
      log.student_class || log.grade_name || 'N/A',
      log.parent_email,
      `${log.failed_subjects_count ?? 0} Subject(s) Failed`,
      log.status,
      log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'
    ]);

    // Add table
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      alternateRowStyles: { fillColor: [249, 250, 251] }, // Gray-50
      margin: { top: 40 }
    });

    // Save PDF explicitly via blob to prevent UUID names in some browsers
    const filename = `email-alerts-${new Date().toISOString().split('T')[0]}.pdf`;
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  useEffect(() => {
    fetchLogs(1, 'all', '');
  }, []);

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Mail className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Loading Email Logs...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent flex items-center">
                <Mail className="w-6 h-6 mr-2 text-purple-600" />
                Email Alert Logs
              </h1>
              <p className="text-gray-500 mt-0.5 text-xs md:text-sm">Monitor and manage email alerts sent to parents</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportToPDF}
                className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg shadow hover:shadow-md transform hover:scale-105 transition-all duration-200 font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => fetchLogs(1, statusFilter, searchTerm)}
                className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow hover:shadow-md transform hover:scale-105 transition-all duration-200 font-semibold"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-3">
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold flex items-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
              </form>

              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent Only</option>
                <option value="failed">Failed Only</option>
              </select>

              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md p-2.5 text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-[9px] font-bold uppercase tracking-widest opacity-80">Total Sent</p>
                  <p className="text-lg font-black leading-tight mt-0.5">{statistics.total_sent || 0}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Mail className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-md p-2.5 text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-[9px] font-bold uppercase tracking-widest opacity-80">Failed</p>
                  <p className="text-lg font-black leading-tight mt-0.5">{statistics.total_failed || 0}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md p-2.5 text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-[9px] font-bold uppercase tracking-widest opacity-80">Success Rate</p>
                  <p className="text-lg font-black leading-tight mt-0.5">{statistics.success_rate || 0}%</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md p-2.5 text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-[9px] font-bold uppercase tracking-widest opacity-80">Students</p>
                  <p className="text-lg font-black leading-tight mt-0.5">{statistics.total_students || 0}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl shadow-md p-2 px-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-xs font-bold">{error}</span>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 bg-white rounded-xl p-4 shadow-md">
          <span className="font-medium">
            Showing <span className="text-purple-600 font-bold">{logs.length}</span> of <span className="text-purple-600 font-bold">{total}</span> email logs
          </span>
          <span className="font-medium">
            Page <span className="text-purple-600 font-bold">{currentPage}</span> of <span className="text-purple-600 font-bold">{totalPages}</span>
          </span>
        </div>

        {/* Email Logs Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-700">
                <tr>
                  <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider">Student</th>
                  <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider">Class</th>
                  <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider">Parent Email</th>
                  <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider">Failed Subjects</th>
                  <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 py-1.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider">Sent Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {logs.map((log, index) => (
                  <tr key={log.id} className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    {/* Student Name + ID */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900">{log.student_name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">ID: {log.student_id}</div>
                    </td>
                    {/* Class (Grade) */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                        Grade {log.student_class || log.grade_name || 'N/A'}
                      </span>
                    </td>
                    {/* Parent Email */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="text-xs text-gray-700 max-w-xs truncate" title={log.parent_email}>
                        {log.parent_email}
                      </div>
                    </td>
                    {/* Failed Subjects Count */}
                    <td className="px-3 py-1.5 whitespace-nowrap text-center">
                      {(log.failed_subjects_count ?? 0) > 0 ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 min-w-[32px]">
                          <AlertCircle className="w-3 h-3" />
                          {log.failed_subjects_count}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    {/* Sent Date & Time */}
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-700">
                      {log.sent_at ? (
                        <div>
                          <div className="font-medium text-xs">{new Date(log.sent_at).toLocaleDateString()}</div>
                          <div className="text-[10px] text-gray-400">{new Date(log.sent_at).toLocaleTimeString()}</div>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${currentPage === pageNum
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && logs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="w-10 h-10 text-purple-600" />
            </div>
            <div className="text-gray-500 text-2xl font-bold mb-3">No email logs found</div>
            <div className="text-gray-400 text-lg mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Email alerts will appear here when students score below 40%'
              }
            </div>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-bold"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Clearing...' : 'Clear Filters'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailAlertLogs;
