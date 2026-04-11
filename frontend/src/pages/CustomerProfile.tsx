import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

export const CustomerProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  const [preferences, setPreferences] = useState({
    interests: [] as string[],
    interestsInput: '',
    selectedPlan: 'free' as 'free' | 'premium',
    preferredRegion: '',
    preferredWilaya: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/customers/me');
        const user = response.data?.data?.user;
        const pref = response.data?.data?.preference;

        setAccount({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
        });

        setPreferences({
          interests: pref?.interests || [],
          interestsInput: (pref?.interests || []).join(', '),
          selectedPlan: pref?.selectedPlan || 'free',
          preferredRegion: pref?.preferredRegion || '',
          preferredWilaya: pref?.preferredWilaya || '',
        });
      } catch (error) {
        console.error(error);
        toast.error('فشل تحميل ملف العميل');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveAccount = async () => {
    try {
      setSavingAccount(true);
      await api.put('/customers/me', account);
      toast.success('تم تحديث المعلومات الشخصية');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث المعلومات الشخصية');
    } finally {
      setSavingAccount(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSavingPrefs(true);

      const interests = preferences.interestsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      await api.put('/customers/me/preferences', {
        interests,
        selectedPlan: preferences.selectedPlan,
        preferredRegion: preferences.preferredRegion,
        preferredWilaya: preferences.preferredWilaya,
      });

      toast.success('تم تحديث الاهتمامات والتفضيلات');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث التفضيلات');
    } finally {
      setSavingPrefs(false);
    }
  };

  const changePassword = async () => {
    try {
      setSavingPassword(true);
      await api.post('/customers/me/change-password', passwordForm);
      toast.success('تم تغيير كلمة المرور');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div style={panelStyle}>جاري تحميل الملف الشخصي...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={panelStyle}>
        <div style={titleStyle}>المعلومات الشخصية</div>

        <div style={{ display: 'grid', gap: 12 }}>
          <input
            value={account.firstName}
            onChange={(e) => setAccount((prev) => ({ ...prev, firstName: e.target.value }))}
            placeholder="الاسم"
            style={inputStyle}
          />
          <input
            value={account.lastName}
            onChange={(e) => setAccount((prev) => ({ ...prev, lastName: e.target.value }))}
            placeholder="اللقب"
            style={inputStyle}
          />
          <input
            value={account.email}
            onChange={(e) => setAccount((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="البريد الإلكتروني"
            style={inputStyle}
          />
          <input
            value={account.phoneNumber}
            onChange={(e) => setAccount((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="رقم الهاتف"
            style={inputStyle}
          />

          <button onClick={saveAccount} disabled={savingAccount} style={primaryButton}>
            {savingAccount ? 'جاري الحفظ...' : 'حفظ المعلومات'}
          </button>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={titleStyle}>الاهتمامات والتفضيلات</div>

        <div style={{ display: 'grid', gap: 12 }}>
          <input
            value={preferences.interestsInput}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, interestsInput: e.target.value }))
            }
            placeholder="مثال: plomberie, design, electricite"
            style={inputStyle}
          />

          <select
            value={preferences.selectedPlan}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                selectedPlan: e.target.value as 'free' | 'premium',
              }))
            }
            style={inputStyle}
          >
            <option value="free">free</option>
            <option value="premium">premium</option>
          </select>

          <input
            value={preferences.preferredRegion}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, preferredRegion: e.target.value }))
            }
            placeholder="الجهة المفضلة"
            style={inputStyle}
          />

          <input
            value={preferences.preferredWilaya}
            onChange={(e) =>
              setPreferences((prev) => ({ ...prev, preferredWilaya: e.target.value }))
            }
            placeholder="الولاية المفضلة"
            style={inputStyle}
          />

          <button onClick={savePreferences} disabled={savingPrefs} style={primaryButton}>
            {savingPrefs ? 'جاري الحفظ...' : 'حفظ الاهتمامات'}
          </button>
        </div>
      </div>

      <div style={{ ...panelStyle, gridColumn: '1 / span 2' }}>
        <div style={titleStyle}>تغيير كلمة المرور</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            placeholder="كلمة المرور الحالية"
            style={inputStyle}
          />
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            placeholder="كلمة المرور الجديدة"
            style={inputStyle}
          />
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            placeholder="تأكيد كلمة المرور"
            style={inputStyle}
          />
        </div>

        <button onClick={changePassword} disabled={savingPassword} style={{ ...primaryButton, marginTop: 14 }}>
          {savingPassword ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
        </button>
      </div>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 18,
};

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#0b1220',
  color: '#fff',
};

const primaryButton: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default CustomerProfile;