import { useState, useEffect } from 'react';
import Header from './Header';
import { paymentAPI } from '../services/api';

interface Payment {
  id: number;
  student_id: number;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  payment_type: 'hostel_fee' | 'tuition_fee' | 'mess_fee' | 'library_fee';
  email_sent: boolean;
  warning_sent: boolean;
  created_at: string;
  student: {
    id: number;
    registration_number: string;
    student_name: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
  };
}

const HostelPaymentManagementPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [dueInWeekPayments, setDueInWeekPayments] = useState<Payment[]>([]);
  const [overduePayments, setOverduePayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'due-week' | 'overdue'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [allRes, pendingRes, dueWeekRes, overdueRes] = await Promise.all([
        paymentAPI.getAll(),
        paymentAPI.getPending(),
        paymentAPI.getDueInWeek(),
        paymentAPI.getOverdue()
      ]);
      
      setPayments(allRes.data);
      setPendingPayments(pendingRes.data);
      setDueInWeekPayments(dueWeekRes.data);
      setOverduePayments(overdueRes.data);
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (paymentId: number) => {
    try {
      await paymentAPI.updateStatus(paymentId, 'paid', new Date().toISOString().split('T')[0]);
      setMessage({ type: 'success', text: 'Payment marked as paid successfully!' });
      fetchPayments();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const handleSendReminders = async () => {
    try {
      const response = await paymentAPI.sendReminders();
      setMessage({ 
        type: 'success', 
        text: `Payment reminders sent: ${response.data.success} successful, ${response.data.failed} failed` 
      });
      fetchPayments();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send payment reminders');
    }
  };

  const handleSendWarnings = async () => {
    try {
      const response = await paymentAPI.sendWarnings();
      setMessage({ 
        type: 'success', 
        text: `Payment warnings sent: ${response.data.success} successful, ${response.data.failed} failed` 
      });
      fetchPayments();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send payment warnings');
    }
  };

  const handleCreateMonthlyPayments = async () => {
    if (!window.confirm('This will create monthly payments for all hostel students. Continue?')) {
      return;
    }

    try {
      await paymentAPI.createMonthly();
      setMessage({ type: 'success', text: 'Monthly payments created for all hostel students!' });
      fetchPayments();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create monthly payments');
    }
  };

  const getDisplayPayments = () => {
    switch (activeTab) {
      case 'pending':
        return pendingPayments;
      case 'due-week':
        return dueInWeekPayments;
      case 'overdue':
        return overduePayments;
      default:
        return payments;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'overdue':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'hostel_fee':
        return 'Hostel Fee';
      case 'tuition_fee':
        return 'Tuition Fee';
      case 'mess_fee':
        return 'Mess Fee';
      case 'library_fee':
        return 'Library Fee';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Payment Management" subtitle="Manage student payments and email notifications" userName="Admin" />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Loading payments...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Payment Management" subtitle="Manage student payments and email notifications" userName="Admin" />
      
      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ 
            backgroundColor: message.type === 'success' ? '#e8f5e8' : '#fff3cd',
            color: message.type === 'success' ? '#2e7d32' : '#856404',
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            {message.text}
          </div>
        )}

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{pendingPayments.length}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Pending Payments</p>
          </div>
          <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>{dueInWeekPayments.length}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Due This Week</p>
          </div>
          <div style={{ backgroundColor: '#f8d7da', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>{overduePayments.length}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Overdue Payments</p>
          </div>
          <div style={{ backgroundColor: '#d4edda', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>
              ${payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Total Collected</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSendReminders}
            disabled={dueInWeekPayments.length === 0}
            style={{
              backgroundColor: dueInWeekPayments.length > 0 ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: dueInWeekPayments.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Send Reminders ({dueInWeekPayments.length})
          </button>
          <button
            onClick={handleSendWarnings}
            disabled={overduePayments.length === 0}
            style={{
              backgroundColor: overduePayments.length > 0 ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: overduePayments.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Send Warnings ({overduePayments.length})
          </button>
          <button
            onClick={handleCreateMonthlyPayments}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Monthly Payments
          </button>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              backgroundColor: activeTab === 'all' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'all' ? 'white' : 'black',
              border: '1px solid #ddd',
              padding: '10px 20px',
              borderRadius: '4px 0 0 4px',
              cursor: 'pointer',
              marginRight: '1px'
            }}
          >
            All Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              backgroundColor: activeTab === 'pending' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'pending' ? 'white' : 'black',
              border: '1px solid #ddd',
              padding: '10px 20px',
              cursor: 'pointer',
              marginRight: '1px'
            }}
          >
            Pending ({pendingPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('due-week')}
            style={{
              backgroundColor: activeTab === 'due-week' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'due-week' ? 'white' : 'black',
              border: '1px solid #ddd',
              padding: '10px 20px',
              cursor: 'pointer',
              marginRight: '1px'
            }}
          >
            Due This Week ({dueInWeekPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            style={{
              backgroundColor: activeTab === 'overdue' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'overdue' ? 'white' : 'black',
              border: '1px solid #ddd',
              padding: '10px 20px',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer'
            }}
          >
            Overdue ({overduePayments.length})
          </button>
        </div>

        {/* Payments Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Student</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Due Date</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email Sent</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getDisplayPayments().map((payment) => (
                <tr key={payment.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <div>
                      <strong>{payment.student.student_name}</strong><br />
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {payment.student.registration_number}
                      </span><br />
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {payment.student.parent_email}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    {getPaymentTypeLabel(payment.payment_type)}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    {new Date(payment.due_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getStatusColor(payment.status) + '20',
                      color: getStatusColor(payment.status)
                    }}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    {payment.email_sent ? (
                      <span style={{ color: '#28a745' }}>✓ Yes</span>
                    ) : (
                      <span style={{ color: '#dc3545' }}>✗ No</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    {payment.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkAsPaid(payment.id)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Mark as Paid
                      </button>
                    )}
                    {payment.status === 'paid' && payment.payment_date && (
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        Paid: {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {getDisplayPayments().length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No payments found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostelPaymentManagementPage;
