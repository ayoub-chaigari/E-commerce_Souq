import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/services';
import { PageHeader } from '../../components/common';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiClock, FiStore } from 'react-icons/fi';

export default function AdminVendors() {
  const [pending, setPending]   = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoad]      = useState(true);
  const [tab, setTab]           = useState('pending');

  const loadPending = async () => {
    const r = await adminService.getPendingVendors();
    setPending(r.data.vendors);
  };

  const loadApproved = async () => {
    const r = await adminService.getUsers({ role: 'vendor', limit: 50 });
    setApproved(r.data.data.filter(u => u.vendorInfo?.isApproved));
  };

  useEffect(() => {
    setLoad(true);
    Promise.all([loadPending(), loadApproved()]).finally(() => setLoad(false));
  }, []);

  const handleApproval = async (id, name, approve) => {
    if (!window.confirm(`${approve ? 'Approuver' : 'Rejeter'} le vendeur ${name} ?`)) return;
    try {
      await adminService.approveVendor(id, approve);
      toast.success(approve ? `${name} approuvé !` : `${name} rejeté`);
      loadPending(); loadApproved();
    } catch { toast.error('Erreur'); }
  };

  const VendorCard = ({ vendor, showActions }) => (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-pale)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
        {vendor.name.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <p style={{ fontWeight: 700 }}>{vendor.name}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{vendor.email}</p>
        {vendor.vendorInfo?.shopName && (
          <p style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, color: 'var(--ink-muted)' }}>
            <FiStore size={12} /> {vendor.vendorInfo.shopName}
          </p>
        )}
      </div>
      {vendor.vendorInfo?.shopDescription && (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', maxWidth: 300, flex: 1 }}>{vendor.vendorInfo.shopDescription}</p>
      )}
      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>{formatDate(vendor.createdAt)}</p>
      {showActions ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success btn-sm" onClick={() => handleApproval(vendor._id, vendor.name, true)}>
            <FiCheck size={14} /> Approuver
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => handleApproval(vendor._id, vendor.name, false)}>
            <FiX size={14} /> Rejeter
          </button>
        </div>
      ) : (
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald)', background: '#d1fae5', padding: '4px 12px', borderRadius: 99 }}>✓ Approuvé</span>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader label="Administration" title="Gestion des Vendeurs" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--surface-3)', paddingBottom: 0 }}>
        {[
          { id: 'pending',  label: `En attente (${pending.length})`,   icon: FiClock },
          { id: 'approved', label: `Approuvés (${approved.length})`,    icon: FiCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', fontWeight: 600, fontSize: '0.875rem', borderBottom: tab === id ? '2px solid var(--ink)' : '2px solid transparent', marginBottom: -2, color: tab === id ? 'var(--ink)' : 'var(--ink-muted)', transition: 'var(--transition)' }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 88 }} />)}
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-muted)' }}>
            <FiClock size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Aucun vendeur en attente d'approbation.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map(v => <VendorCard key={v._id} vendor={v} showActions />)}
          </div>
        )
      ) : (
        approved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-muted)' }}>Aucun vendeur approuvé.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {approved.map(v => <VendorCard key={v._id} vendor={v} showActions={false} />)}
          </div>
        )
      )}
    </div>
  );
}
