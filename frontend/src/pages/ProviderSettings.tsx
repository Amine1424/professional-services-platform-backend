import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

export const ProviderSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  const [privacy, setPrivacy] = useState({
    privacyShowEmail: false,
    privacyShowPhone: true,
    privacyShowAddress: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [providerRes, prefRes] = await Promise.all([
          api.get('/providers/me'),
          api.get('/providers/me/preferences'),
        ]);

        const provider = providerRes.data?.data;
        const preferences = prefRes.data?.data?.preference;

        setAccount({
          firstName: provider?.user?.firstName || '',
          lastName: provider?.user?.lastName || '',
          email: provider?.user?.email || '',
          phoneNumber: provider?.user?.phoneNumber || '',
        });

        setPrivacy({
          privacyShowEmail: preferences?.privacyShowEmail || false,
          privacyShowPhone: preferences?.privacyShowPhone ?? true,
          privacyShowAddress: preferences?.privacyShowAddress || false,
        });
      } catch (error) {
        console.error(error);
        toast.error('فشل تحميل الإعدادات');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveAccount = async () => {
    try {
      setSavingAccount(true);
      await api.put('/providers/me/account', account);
      toast.success('تم تحديث المعلومات الشخصية');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث المعلومات الشخصية');
    } finally {
      setSavingAccount(false);
    }
  };

  const savePrivacy = async () => {
    try {
      setSavingPrivacy(true);
      await api.put('/providers/me/preferences', privacy);
      toast.success('تم تحديث الخصوصية');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الخصوصية');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('املأ كل حقول كلمة المرور');
      return;
    }

    try {
      setSavingPassword(true);
      await api.post('/providers/me/change-password', passwordForm);
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

  if (loading) return <div style={panelStyle}>جاري تحميل الإعدادات...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={panelStyle}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
          المعلومات الشخصية
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>الاسم</label>
            <input
              value={account.firstName}
              onChange={(e) => setAccount((prev) => ({ ...prev, firstName: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>اللقب</label>
            <input
              value={account.lastName}
              onChange={(e) => setAccount((prev) => ({ ...prev, lastName: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input
              value={account.email}
              onChange={(e) => setAccount((prev) => ({ ...prev, email: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>رقم الهاتف</label>
            <input
              value={account.phoneNumber}
              onChange={(e) => setAccount((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <button onClick={saveAccount} disabled={savingAccount} style={primaryButton}>
            {savingAccount ? 'جاري الحفظ...' : 'حفظ المعلومات الشخصية'}
          </button>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
          الخصوصية
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={checkRowStyle}>
            <input
              type="checkbox"
              checked={privacy.privacyShowEmail}
              onChange={(e) =>
                setPrivacy((prev) => ({
                  ...prev,
                  privacyShowEmail: e.target.checked,
                }))
              }
            />
            إظهار البريد الإلكتروني في البروفايل العام
          </label>

          <label style={checkRowStyle}>
            <input
              type="checkbox"
              checked={privacy.privacyShowPhone}
              onChange={(e) =>
                setPrivacy((prev) => ({
                  ...prev,
                  privacyShowPhone: e.target.checked,
                }))
              }
            />
            إظهار الهاتف في البروفايل العام
          </label>

          <label style={checkRowStyle}>
            <input
              type="checkbox"
              checked={privacy.privacyShowAddress}
              onChange={(e) =>
                setPrivacy((prev) => ({
                  ...prev,
                  privacyShowAddress: e.target.checked,
                }))
              }
            />
            إظهار العنوان في البروفايل العام
          </label>

          <button onClick={savePrivacy} disabled={savingPrivacy} style={primaryButton}>
            {savingPrivacy ? 'جاري الحفظ...' : 'حفظ إعدادات الخصوصية'}
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            color: '#c7d0e1',
            lineHeight: 1.7,
          }}
        >
          الخصوصية هنا مرتبطة فعليًا بالحساب، ومجهزة لكي تُستخدم لاحقًا في
          صفحة البروفايل العام للعميل.
        </div>
      </div>

      <div style={{ ...panelStyle, gridColumn: '1 / span 2' }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
          الأمان وتغيير كلمة المرور
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <label style={labelStyle}>كلمة المرور الحالية</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#d6def0',
  fontWeight: 600,
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

const checkRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: '#d6def0',
};

export default ProviderSettings;