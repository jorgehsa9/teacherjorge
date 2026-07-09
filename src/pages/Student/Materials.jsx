import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentMaterials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('Materials')
        .select('*')
        .eq('student_email', user.email)
        .order('created_at', { ascending: false });

      if (data) {
        setMaterials(data);
      } else {
        console.error("Error fetching materials:", error);
      }
      setLoading(false);
    };

    fetchMaterials();
  }, [user]);

  const formatClassDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dashboard-wrapper h-full flex flex-col relative animate-fade-in-up">
      <div className="dashboard-header mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => navigate('/dashboard/student')} 
              className="text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
          <h1>All Materials</h1>
          <p>Everything your teacher has shared with you.</p>
        </div>
      </div>

      <div className="card glass flex-1 p-0 overflow-hidden animate-fade-in-up delay-100 flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading your materials...</div>
        ) : materials.length > 0 ? (
          <div className="px-4 pb-4 overflow-x-auto flex-1">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date Added</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat) => (
                  <tr key={mat.id}>
                    <td>
                      <span className="font-medium text-main flex items-center gap-2">
                        <FileText size={16} className="text-primary"/> {mat.title}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)'}}>
                        {mat.file_type}
                      </span>
                    </td>
                    <td className="text-muted">
                      {formatClassDate(mat.created_at)}
                    </td>
                    <td className="text-right">
                      <a 
                        href={mat.file_url.startsWith('http') ? mat.file_url : `https://${mat.file_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                      >
                        <Download size={14} /> Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Your teacher hasn't shared any materials with you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMaterials;
