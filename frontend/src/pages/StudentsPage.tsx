import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, AlertCircle, ArrowRight, ArrowLeft, Edit, Trash2, Eye } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // View state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState<any>(null);

  // Student Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [dobDay, setDobDay] = useState('01');
  const [dobMonth, setDobMonth] = useState('January');
  const [dobYear, setDobYear] = useState('2010');
  const [gender, setGender] = useState('Male');
  const [nationality, setNationality] = useState('');
  const [religion, setReligion] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [address, setAddress] = useState('');

  // Parent Form State
  const [parentType, setParentType] = useState('Father');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentGender, setParentGender] = useState('Male');
  const [parentReligion, setParentReligion] = useState('');
  const [parentEthnicity, setParentEthnicity] = useState('');
  const [parentNationality, setParentNationality] = useState('');
  const [parentAddress, setParentAddress] = useState('');

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/students`);
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      const dob = `${dobYear}-${dobMonth}-${dobDay}`;
      const payload = {
        first_name: firstName, last_name: lastName, dob, gender, nationality, religion, ethnicity, address, rfid_tag: rfidTag,
        parent_type: parentType, parent_name: parentName, parent_phone: parentPhone, parent_email: parentEmail,
        parent_gender: parentGender, parent_religion: parentReligion, parent_ethnicity: parentEthnicity,
        parent_nationality: parentNationality, parent_address: parentAddress
      };

      if (isEditing && editingId) {
        await axios.put(`${API_BASE_URL}/students/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/students/register`, payload);
      }

      setShowModal(false);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      const serverError = error.response?.data?.error;
      const validationError = error.response?.data?.errors?.[0]?.msg;
      setErrorMsg(serverError || validationError || `Failed to ${isEditing ? 'update' : 'register'} student`);
    }
  };

  const handleEditStudent = (student: any) => {
      resetForm();
      setIsEditing(true);
      setEditingId(student.id);
      setFirstName(student.first_name);
      setLastName(student.last_name);
      
      const parts = student.dob.split('-');
      if (parts.length === 3) {
          setDobYear(parts[0]);
          setDobMonth(parts[1]);
          setDobDay(parts[2]);
      }
      setGender(student.gender); setNationality(student.nationality); setReligion(student.religion); setEthnicity(student.ethnicity); setAddress(student.address);
      setRfidTag(student.rfid_tag || '');
      setParentType(student.parent_type); setParentName(student.parent_name); setParentPhone(student.parent_phone); setParentEmail(student.parent_email); 
      setParentGender(student.parent_gender); setParentReligion(student.parent_religion); setParentEthnicity(student.parent_ethnicity); 
      setParentNationality(student.parent_nationality); setParentAddress(student.parent_address);
      
      setShowModal(true);
  };

  const handleDeleteStudent = async (id: number) => {
      if (window.confirm('Are you sure you want to delete this student? If they are assigned to a room, the room occupancy will be updated automatically.')) {
          try {
              await axios.delete(`${API_BASE_URL}/students/${id}`);
              fetchStudents();
          } catch (error: any) {
              console.error('Error deleting student', error);
              alert(error.response?.data?.error || 'Failed to delete student');
          }
      }
  };

  const handleViewStudent = (student: any) => {
      setViewStudent(student);
      setShowViewModal(true);
  };

  const resetForm = () => {
    setStep(1);
    setIsEditing(false);
    setEditingId(null);
    setFirstName(''); setLastName(''); setDobDay('01'); setDobMonth('January'); setDobYear('2010');
    setGender('Male'); setNationality(''); setReligion(''); setEthnicity(''); setAddress(''); setRfidTag('');
    setParentType('Father'); setParentName(''); setParentPhone(''); setParentEmail(''); setParentGender('Male');
    setParentReligion(''); setParentEthnicity(''); setParentNationality(''); setParentAddress('');
  };

  const nextStep = () => {
    if (!firstName || !lastName || !nationality || !religion || !ethnicity || !address) {
        setErrorMsg('Please fill in all required fields.');
        return;
    }
    setErrorMsg('');
    setStep(2);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Registration</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Register new students before assigning them to rooms</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <UserPlus size={16} />
          Register Student
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Gender</th>
              <th>DOB</th>
              <th>Parent Name</th>
              <th>Parent Phone</th>
              <th>Room Assignment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No students registered.
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: 500 }}>{student.first_name} {student.last_name}</td>
                  <td>{student.gender}</td>
                  <td>{student.dob}</td>
                  <td>{student.parent_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{student.parent_phone}</td>
                  <td>
                    {student.room_id ? (
                      <span className="badge available">Room ID: {student.room_id}</span>
                    ) : (
                      <span className="badge pending">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', background: 'var(--surface-hover)' }} title="View Details" onClick={() => handleViewStudent(student)}>
                        <Eye size={16} />
                      </button>
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', background: 'var(--primary)', color: 'white' }} title="Edit" onClick={() => handleEditStudent(student)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', background: 'var(--danger)', color: 'white' }} title="Delete" onClick={() => handleDeleteStudent(student.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: '700' }}>{isEditing ? 'Edit Student' : 'Student Registration Form'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)} style={{ position: 'absolute', right: '0', fontSize: '2rem' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: step === 1 ? '600' : '400', color: step === 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    <span style={{ background: step === 1 ? 'var(--primary)' : 'var(--surface-hover)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>1</span>
                    Student Information
                </div>
                <div style={{ width: '40px', height: '2px', background: 'var(--border)' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: step === 2 ? '600' : '400', color: step === 2 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    <span style={{ background: step === 2 ? 'var(--primary)' : 'var(--surface-hover)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>2</span>
                    Parent / Guardian
                </div>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={step === 2 ? handleRegisterStudent : (e) => { e.preventDefault(); nextStep(); }}>
              {step === 1 && (
                <>
                  <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Student Information</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>First Name *</label>
                      <input type="text" className="form-control" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input type="text" className="form-control" required value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                          <label>Date of Birth *</label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <select className="form-control" value={dobDay} onChange={e => setDobDay(e.target.value)}>
                                  {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <select className="form-control" value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
                                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select className="form-control" value={dobYear} onChange={e => setDobYear(e.target.value)}>
                                  {Array.from({length: 20}, (_, i) => String(new Date().getFullYear() - 5 - i)).map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="form-group">
                          <label>Gender *</label>
                          <select className="form-control" value={gender} onChange={e => setGender(e.target.value)}>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                          </select>
                      </div>
                      <div className="form-group">
                          <label>Nationality *</label>
                          <input type="text" className="form-control" required value={nationality} onChange={e => setNationality(e.target.value)} />
                      </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                          <label>Religion *</label>
                          <input type="text" className="form-control" required value={religion} onChange={e => setReligion(e.target.value)} />
                      </div>
                      <div className="form-group">
                          <label>Ethnicity *</label>
                          <input type="text" className="form-control" required value={ethnicity} onChange={e => setEthnicity(e.target.value)} />
                      </div>
                  </div>

                  <div className="form-group">
                    <label>Address *</label>
                    <textarea className="form-control" rows={3} required value={address} onChange={e => setAddress(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button type="submit" className="btn" style={{ background: 'var(--primary)', color: 'white' }}>
                      Continue to Parent Details <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Parent/Guardian Information</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                          <label>Parent Type *</label>
                          <select className="form-control" value={parentType} onChange={e => setParentType(e.target.value)}>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Guardian">Guardian</option>
                          </select>
                      </div>
                      <div className="form-group">
                          <label>Parent Name *</label>
                          <input type="text" className="form-control" required value={parentName} onChange={e => setParentName(e.target.value)} />
                      </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                          <label>Parent Phone *</label>
                          <input type="text" className="form-control" required value={parentPhone} onChange={e => setParentPhone(e.target.value)} />
                      </div>
                      <div className="form-group">
                          <label>Parent Email</label>
                          <input type="email" className="form-control" required value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
                      </div>
                      <div className="form-group">
                          <label>Parent Gender *</label>
                          <select className="form-control" value={parentGender} onChange={e => setParentGender(e.target.value)}>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                          </select>
                      </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                          <label>Parent Religion *</label>
                          <input type="text" className="form-control" required value={parentReligion} onChange={e => setParentReligion(e.target.value)} />
                      </div>
                      <div className="form-group">
                          <label>Parent Ethnicity *</label>
                          <input type="text" className="form-control" required value={parentEthnicity} onChange={e => setParentEthnicity(e.target.value)} />
                      </div>
                      <div className="form-group">
                          <label>Parent Nationality *</label>
                          <input type="text" className="form-control" required value={parentNationality} onChange={e => setParentNationality(e.target.value)} />
                      </div>
                  </div>

                  <div className="form-group">
                    <label>Parent Address *</label>
                    <textarea className="form-control" rows={3} required value={parentAddress} onChange={e => setParentAddress(e.target.value)} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button type="submit" className="btn" style={{ background: 'var(--primary)', color: 'white' }}>
                      {isEditing ? 'Update Student' : 'Register Student'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Student Details</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)} style={{ position: 'absolute', right: '0' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Student Information</h3>
                <p><strong>Name:</strong> {viewStudent.first_name} {viewStudent.last_name}</p>
                <p><strong>DOB:</strong> {viewStudent.dob}</p>
                <p><strong>Gender:</strong> {viewStudent.gender}</p>
                <p><strong>Nationality:</strong> {viewStudent.nationality}</p>
                <p><strong>Religion:</strong> {viewStudent.religion}</p>
                <p><strong>Ethnicity:</strong> {viewStudent.ethnicity}</p>
                <p><strong>RFID Tag:</strong> {viewStudent.rfid_tag || 'Not Registered'}</p>
                <p><strong>Address:</strong> {viewStudent.address}</p>
                <p><strong>Room Assignment:</strong> {viewStudent.room_id || 'Unassigned'}</p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Parent/Guardian Information</h3>
                <p><strong>Name:</strong> {viewStudent.parent_name} ({viewStudent.parent_type})</p>
                <p><strong>Phone:</strong> {viewStudent.parent_phone}</p>
                <p><strong>Email:</strong> {viewStudent.parent_email || 'N/A'}</p>
                <p><strong>Gender:</strong> {viewStudent.parent_gender}</p>
                <p><strong>Nationality:</strong> {viewStudent.parent_nationality}</p>
                <p><strong>Religion:</strong> {viewStudent.parent_religion}</p>
                <p><strong>Ethnicity:</strong> {viewStudent.parent_ethnicity}</p>
                <p><strong>Address:</strong> {viewStudent.parent_address}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
