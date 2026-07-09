import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Edit, Trash, X, Phone, Clock, FileText } from 'lucide-react';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newStudent, setNewStudent] = useState({ name: '', email: '', level: 'Beginner (A1)', status: 'Active' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('Students').select('*');
    if (data) setStudents(data);
    else console.error('Error fetching students:', error);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('Students').insert([
      { 
        name: newStudent.name, 
        email: newStudent.email, 
        level: newStudent.level, 
        status: newStudent.status 
      }
    ]);

    if (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student. Ensure you have insert permissions.');
    } else {
      await fetchStudents();
      setNewStudent({ name: '', email: '', level: 'Beginner (A1)', status: 'Active' });
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const openEditModal = (student) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Fallback to updating by email if 'id' column doesn't exist
    const matchColumn = editingStudent.id ? 'id' : 'email';
    const matchValue = editingStudent.id || editingStudent.email;

    const { error } = await supabase
      .from('Students')
      .update({
        name: editingStudent.name,
        email: editingStudent.email,
        level: editingStudent.level,
        status: editingStudent.status,
        phone_number: editingStudent.phone_number || null,
        timezone: editingStudent.timezone || 'UTC',
        internal_notes: editingStudent.internal_notes || null,
        meet_link: editingStudent.meet_link || null,
        hours_studied: parseInt(editingStudent.hours_studied) || 0,
        current_module: editingStudent.current_module || null,
        module_progress: parseInt(editingStudent.module_progress) || 0,
        badges_earned: parseInt(editingStudent.badges_earned) || 0
      })
      .eq(matchColumn, matchValue);

    if (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student. Ensure you have update permissions.');
    } else {
      await fetchStudents();
      setIsEditModalOpen(false);
      setEditingStudent(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      const matchColumn = student.id ? 'id' : 'email';
      const matchValue = student.id || student.email;
      const { error } = await supabase.from('Students').delete().eq(matchColumn, matchValue);
      if (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Ensure you have delete permissions.');
      } else {
        await fetchStudents();
      }
    }
  };

  const filteredStudents = students.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-wrapper h-full flex flex-col relative animate-fade-in-up">
      <div className="dashboard-header mb-6 flex justify-between items-end">
        <div>
          <h1>Students</h1>
          <p>Manage your students and their levels.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="search-container" style={{ position: 'relative' }}>
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="input glass"
              style={{
                width: '280px',
                paddingLeft: '2.75rem',
                borderRadius: '99px',
                backgroundColor: 'var(--surface)'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Add Student</button>
        </div>
      </div>

      <div className="card glass flex-1 p-0 overflow-hidden animate-fade-in-up delay-200">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading students...</div>
        ) : (
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map((student, i) => (
                  <tr key={student.id || i}>
                    <td>
                      <span className="font-medium text-main" style={{fontSize: '1.05rem', letterSpacing: '0.02em'}}>
                        {student.name}
                      </span>
                    </td>
                    <td className="text-muted">{student.email}</td>
                    <td>
                      <span className="badge" style={{backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)'}}>
                        {student.level}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${student.status === 'Active' ? 'success' : 'warning'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => openEditModal(student)} className="btn-icon text-muted hover:text-primary" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none', marginRight: '8px'}}><Edit size={16} /></button>
                      <button onClick={() => handleDeleteStudent(student)} className="btn-icon text-muted hover:text-danger" style={{padding: '4px', cursor: 'pointer', background: 'none', border: 'none'}}><Trash size={16} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted" style={{background: 'transparent', boxShadow: 'none'}}>No students found in the database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '500px', backgroundColor: 'var(--surface)', margin: '1rem'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Add New Student</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent}>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" className="input w-full" required placeholder="e.g. Maria Santos"
                  value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" className="input w-full" required placeholder="student@example.com"
                  value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>English Level</label>
                  <select className="input w-full" value={newStudent.level} onChange={(e) => setNewStudent({...newStudent, level: e.target.value})}>
                    <option>Beginner (A1)</option><option>Pre-Intermediate (A2)</option><option>Intermediate (B1)</option><option>Upper-Intermediate (B2)</option><option>Advanced (C1)</option>
                  </select>
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Status</label>
                  <select className="input w-full" value={newStudent.status} onChange={(e) => setNewStudent({...newStudent, status: e.target.value})}>
                    <option>Active</option><option>Pending</option><option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditModalOpen && editingStudent && (
        <div className="modal-overlay flex items-center justify-center" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="card glass w-full" style={{maxWidth: '600px', backgroundColor: 'var(--surface)', margin: '1rem', maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{margin: 0}}>Edit Student Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStudent}>
              <div className="grid-cols-2">
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" className="input w-full" required
                    value={editingStudent.name || ''} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" className="input w-full" required
                    value={editingStudent.email || ''} onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="input-group">
                  <label className="flex items-center gap-2"><Phone size={14}/> Phone Number</label>
                  <input type="text" className="input w-full" placeholder="+1 234 567 8900"
                    value={editingStudent.phone_number || ''} onChange={(e) => setEditingStudent({...editingStudent, phone_number: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="flex items-center gap-2"><Clock size={14}/> Timezone</label>
                  <input type="text" className="input w-full" placeholder="e.g. America/Sao_Paulo"
                    value={editingStudent.timezone || ''} onChange={(e) => setEditingStudent({...editingStudent, timezone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>English Level</label>
                  <select className="input w-full" value={editingStudent.level} onChange={(e) => setEditingStudent({...editingStudent, level: e.target.value})}>
                    <option>Beginner (A1)</option><option>Pre-Intermediate (A2)</option><option>Intermediate (B1)</option><option>Upper-Intermediate (B2)</option><option>Advanced (C1)</option>
                  </select>
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Status</label>
                  <select className="input w-full" value={editingStudent.status} onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value})}>
                    <option>Active</option><option>Pending</option><option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="flex items-center gap-2"><Phone size={14}/> Unique Google Meet Link</label>
                <input type="url" className="input w-full" placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={editingStudent.meet_link || ''} onChange={(e) => setEditingStudent({...editingStudent, meet_link: e.target.value})}
                />
              </div>

              <div className="grid-cols-2 mt-4" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Current Module</label>
                  <input type="text" className="input w-full" placeholder="e.g. Business Phrasal Verbs"
                    value={editingStudent.current_module || ''} onChange={(e) => setEditingStudent({...editingStudent, current_module: e.target.value})}
                  />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Module Progress (%)</label>
                  <input type="number" min="0" max="100" className="input w-full" placeholder="75"
                    value={editingStudent.module_progress || ''} onChange={(e) => setEditingStudent({...editingStudent, module_progress: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{marginBottom: '1.25rem'}}>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Hours Studied</label>
                  <input type="number" min="0" className="input w-full" placeholder="24"
                    value={editingStudent.hours_studied || ''} onChange={(e) => setEditingStudent({...editingStudent, hours_studied: e.target.value})}
                  />
                </div>
                <div className="input-group" style={{marginBottom: 0}}>
                  <label>Badges Earned</label>
                  <input type="number" min="0" className="input w-full" placeholder="8"
                    value={editingStudent.badges_earned || ''} onChange={(e) => setEditingStudent({...editingStudent, badges_earned: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="flex items-center gap-2"><FileText size={14}/> Teacher Internal Notes</label>
                <textarea 
                  className="input w-full" 
                  rows="3" 
                  placeholder="Notes about learning style, goals, etc. (Not visible to student)"
                  value={editingStudent.internal_notes || ''} 
                  onChange={(e) => setEditingStudent({...editingStudent, internal_notes: e.target.value})}
                  style={{resize: 'vertical', fontFamily: 'inherit'}}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 mt-6 border-t pt-4" style={{borderColor: 'var(--border)'}}>
                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
