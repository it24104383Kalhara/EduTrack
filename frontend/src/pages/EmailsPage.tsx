import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, CheckCircle, XCircle, Calendar, User, Tag } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/emails`);
      setEmails(res.data);
    } catch (error) {
      console.error("Error fetching email logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Email Notification History</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track all communications sent to parents</p>
        </div>
        <button className="btn btn-primary" onClick={fetchEmails}>
          Refresh History
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading email history...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Parent Email</th>
                <th>Email Type</th>

                <th>Status</th>
                <th>Sent At</th>
                <th>Error Message</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No emails have been sent yet.
                  </td>
                </tr>
              ) : (
                emails.map(email => (
                  <tr key={email.id}>
                    <td>#{email.id}</td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} color="var(--text-secondary)" />
                        {email.student_name || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="var(--text-secondary)" />
                        {email.parent_email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag size={14} color="var(--text-secondary)" />
                        {email.email_type}
                      </div>
                    </td>

                    <td>
                      {email.status === 'sent' ? (
                        <span className="badge paid" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} />
                          SENT
                        </span>
                      ) : (
                        <span className="badge pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={14} />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} color="var(--primary)" />
                        {email.sent_at ? new Date(email.sent_at).toLocaleString() : '—'}
                      </div>
                    </td>
                    <td style={{ color: email.error_message ? 'red' : 'var(--text-secondary)' }}>
                      {email.error_message || '—'}
                    </td>
                    <td>
                      {email.created_at ? new Date(email.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
