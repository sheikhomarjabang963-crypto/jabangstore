import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BusinessApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);

  async function loadApplications() {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase.rpc(
      'get_business_applications'
    );

    if (loadError) {
      setError(loadError.message);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function approveApplication(application) {
    const confirmed = window.confirm(
      `Approve "${application.business_name}" and create the business?`
    );

    if (!confirmed) return;

    setProcessing(true);
    setError('');

    const { error: approveError } = await supabase.rpc(
      'approve_business_application',
      {
        p_application_id: application.id,
      }
    );

    if (approveError) {
      setError(approveError.message);
    } else {
      alert(
        `${application.business_name} has been approved successfully.`
      );

      setSelectedApplication(null);
      await loadApplications();
    }

    setProcessing(false);
  }

  async function rejectApplication(application) {
    const reason = window.prompt(
      'Enter the reason for rejecting this application:'
    );

    if (reason === null) return;

    setProcessing(true);
    setError('');

    const { error: rejectError } = await supabase.rpc(
      'reject_business_application',
      {
        p_application_id: application.id,
        p_rejection_reason: reason,
      }
    );

    if (rejectError) {
      setError(rejectError.message);
    } else {
      alert(
        `${application.business_name} has been rejected.`
      );

      setSelectedApplication(null);
      await loadApplications();
    }

    setProcessing(false);
  }

  function statusStyle(status) {
    if (status === 'approved') {
      return {
        background: '#e8f7ef',
        color: '#0B3D2E',
      };
    }

    if (status === 'rejected') {
      return {
        background: '#fdecec',
        color: '#a32121',
      };
    }

    return {
      background: '#fff7df',
      color: '#806500',
    };
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Business Applications</h1>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Business Applications</h1>
          <p>
            Review and manage businesses requesting access to JabangStore.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadApplications}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '14px',
            marginBottom: '20px',
            borderRadius: '10px',
            background: '#fdecec',
            color: '#a32121',
          }}
        >
          {error}
        </div>
      )}

      <div className="card">
        {applications.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <h3>No business applications yet</h3>
            <p>
              New business registration requests will appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>
                        {application.business_name}
                      </strong>
                    </td>

                    <td>{application.owner_name}</td>

                    <td>{application.email}</td>

                    <td>{application.phone || '—'}</td>

                    <td>
                      <span
                        style={{
                          ...statusStyle(application.status),
                          padding: '6px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {application.status.toUpperCase()}
                      </span>
                    </td>

                    <td>
                      {application.created_at
                        ? new Date(
                            application.created_at
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          setSelectedApplication(application)
                        }
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApplication && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="page-header">
              <div>
                <h2>
                  {selectedApplication.business_name}
                </h2>
                <p>Business application review</p>
              </div>
            </div>

            <div style={{ lineHeight: 1.8 }}>
              <p>
                <strong>Owner:</strong>{' '}
                {selectedApplication.owner_name}
              </p>

              <p>
                <strong>Email:</strong>{' '}
                {selectedApplication.email}
              </p>

              <p>
                <strong>Phone:</strong>{' '}
                {selectedApplication.phone || '—'}
              </p>

              <p>
                <strong>Business Type:</strong>{' '}
                {selectedApplication.business_type || '—'}
              </p>

              <p>
                <strong>Address:</strong>{' '}
                {selectedApplication.address || '—'}
              </p>

              <p>
                <strong>Description:</strong>{' '}
                {selectedApplication.description || '—'}
              </p>

              <p>
                <strong>Status:</strong>{' '}
                {selectedApplication.status.toUpperCase()}
              </p>

              {selectedApplication.rejection_reason && (
                <p>
                  <strong>Rejection Reason:</strong>{' '}
                  {selectedApplication.rejection_reason}
                </p>
              )}
            </div>

            {selectedApplication.status === 'pending' && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '25px',
                }}
              >
                <button
                  className="primary-button"
                  disabled={processing}
                  onClick={() =>
                    approveApplication(selectedApplication)
                  }
                >
                  {processing ? 'Processing...' : 'Approve'}
                </button>

                <button
                  className="secondary-button"
                  disabled={processing}
                  onClick={() =>
                    rejectApplication(selectedApplication)
                  }
                >
                  Reject
                </button>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <button
                className="secondary-button"
                onClick={() => setSelectedApplication(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
