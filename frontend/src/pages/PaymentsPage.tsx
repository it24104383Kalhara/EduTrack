import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, CheckCircle, Clock } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingMsg, setLoadingMsg] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/payments`);
      setPayments(res.data);
    } catch (error) {
      console.error("Error fetching payments", error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleMarkPaid = async (paymentId: number) => {
    try {
      await axios.put(`${API_BASE_URL}/payments/${paymentId}/pay`);
      fetchPayments();
    } catch (error) {
      console.error("Error marking as paid", error);
    }
  };

  const handleMarkUnpaid = async (paymentId: number) => {
    try {
      await axios.put(`${API_BASE_URL}/payments/${paymentId}/unpay`);
      fetchPayments();
    } catch (error) {
      console.error("Error marking as unpaid", error);
    }
  };


  const handleSendAllReminders = async () => {
    try {
      setLoadingMsg('Sending monthly reminders for the 10th...');
      const res = await axios.post(`${API_BASE_URL}/payments/send-all-reminders`);
      
      let finalMsg = res.data.message;
      if (res.data.preview) {
        finalMsg += `\n\nPreview the email here:\n${res.data.preview}`;
        console.log("Email Preview:", res.data.preview);
      }
      alert(finalMsg);
    } catch (error) {
      console.error("Error sending bulk reminders", error);
      alert('Failed to send bulk reminders.');
    } finally {
      setLoadingMsg('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track hostel fees and notify parents</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: '600' }} onClick={handleSendAllReminders} disabled={!!loadingMsg}>
            <Mail size={18} />
            {loadingMsg || 'Send Reminders to All Parents'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Parent Email</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map(payment => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td style={{ fontWeight: 500 }}>{payment.student_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{payment.parent_email}</td>
                  <td style={{ fontWeight: 600 }}>${payment.amount}</td>
                  <td>{payment.due_date}</td>
                  <td>
                    <span className={`badge ${payment.status === 'paid' ? 'paid' : 'pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {payment.status === 'paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {payment.status === 'pending' ? (
                      <button 
                        className="btn btn-success" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => handleMarkPaid(payment.id)}
                      >
                        <CheckCircle size={14} />
                        Mark as Paid
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        onClick={() => handleMarkUnpaid(payment.id)}
                      >
                        <Clock size={14} />
                        Mark as Unpaid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
