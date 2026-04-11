import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface RegionItem {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
  displayOrder: number;
  isActive: boolean;
  wilayas: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface WilayaItem {
  id: string;
  regionId?: string | null;
  name: string;
  slug: string;
  code?: string | null;
  displayOrder: number;
  isActive: boolean;
  region?: {
    id: string;
    name: string;
  } | null;
}

export const AdminRegions: React.FC = () => {
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [wilayas, setWilayas] = useState<WilayaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [regionForm, setRegionForm] = useState({
    name: '',
    slug: '',
    code: '',
  });

  const [wilayaForm, setWilayaForm] = useState({
    regionId: '',
    name: '',
    slug: '',
    code: '',
  });

  const load = async () => {
    try {
      setLoading(true);

      const [regionsRes, wilayasRes] = await Promise.all([
        api.get('/admin/regions/regions'),
        api.get('/admin/regions/wilayas'),
      ]);

      setRegions(regionsRes.data?.data || []);
      setWilayas(wilayasRes.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل المناطق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createRegion = async () => {
    try {
      await api.post('/admin/regions/regions', regionForm);
      toast.success('تم إنشاء الجهة');
      setRegionForm({ name: '', slug: '', code: '' });
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إنشاء الجهة');
    }
  };

  const createWilaya = async () => {
    try {
      await api.post('/admin/regions/wilayas', wilayaForm);
      toast.success('تم إنشاء الولاية');
      setWilayaForm({ regionId: '', name: '', slug: '', code: '' });
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إنشاء الولاية');
    }
  };

  const deleteRegion = async (id: string) => {
    try {
      await api.delete(`/admin/regions/regions/${id}`);
      toast.success('تم حذف الجهة');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف الجهة');
    }
  };

  const deleteWilaya = async (id: string) => {
    try {
      await api.delete(`/admin/regions/wilayas/${id}`);
      toast.success('تم حذف الولاية');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف الولاية');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={cardStyle}>
          <div style={titleStyle}>إنشاء جهة</div>

          <div style={{ display: 'grid', gap: 12 }}>
            <input
              value={regionForm.name}
              onChange={(e) => setRegionForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="اسم الجهة"
              style={inputStyle}
            />

            <input
              value={regionForm.slug}
              onChange={(e) => setRegionForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="slug"
              style={inputStyle}
            />

            <input
              value={regionForm.code}
              onChange={(e) => setRegionForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="code"
              style={inputStyle}
            />

            <button onClick={createRegion} style={primaryButton}>
              إنشاء الجهة
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={titleStyle}>إنشاء ولاية</div>

          <div style={{ display: 'grid', gap: 12 }}>
            <select
              value={wilayaForm.regionId}
              onChange={(e) => setWilayaForm((p) => ({ ...p, regionId: e.target.value }))}
              style={inputStyle}
            >
              <option value="">بدون جهة</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>

            <input
              value={wilayaForm.name}
              onChange={(e) => setWilayaForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="اسم الولاية"
              style={inputStyle}
            />

            <input
              value={wilayaForm.slug}
              onChange={(e) => setWilayaForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="slug"
              style={inputStyle}
            />

            <input
              value={wilayaForm.code}
              onChange={(e) => setWilayaForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="code"
              style={inputStyle}
            />

            <button onClick={createWilaya} style={primaryButton}>
              إنشاء الولاية
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={titleStyle}>الجهات</div>

        {loading ? (
          <div style={mutedText}>جاري التحميل...</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {regions.map((region) => (
              <div key={region.id} style={innerCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800 }}>{region.name}</div>
                    <div style={mutedText}>
                      {region.slug} {region.code ? `• ${region.code}` : ''}
                    </div>
                    <div style={mutedText}>
                      الولايات: {region.wilayas.map((w) => w.name).join('، ') || 'لا توجد'}
                    </div>
                  </div>

                  <button onClick={() => deleteRegion(region.id)} style={dangerButton}>
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={titleStyle}>الولايات</div>

        {loading ? (
          <div style={mutedText}>جاري التحميل...</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {wilayas.map((wilaya) => (
              <div key={wilaya.id} style={innerCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800 }}>{wilaya.name}</div>
                    <div style={mutedText}>
                      {wilaya.slug} {wilaya.code ? `• ${wilaya.code}` : ''}
                    </div>
                    <div style={mutedText}>
                      الجهة: {wilaya.region?.name || 'غير محددة'}
                    </div>
                  </div>

                  <button onClick={() => deleteWilaya(wilaya.id)} style={dangerButton}>
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: 18,
};

const innerCard: React.CSSProperties = {
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  padding: 14,
};

const titleStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 12,
};

const mutedText: React.CSSProperties = {
  color: '#cbd5e1',
  marginTop: 6,
  lineHeight: 1.7,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
};

const primaryButton: React.CSSProperties = {
  padding: '12px 16px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const dangerButton: React.CSSProperties = {
  padding: '10px 14px',
  background: '#7f1d1d',
  border: 'none',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default AdminRegions;