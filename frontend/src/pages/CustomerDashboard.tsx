import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { getStoredUser } from '../lib/role-routing';
import '../styles/auth.css';

export const CustomerRegister: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  useEffect(() => {
    const user = getStoredUser();
    const token = localStorage.getItem('accessToken');

    if (token && user) {
      navigate('/customer/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;

    setFormData((prev) => ({
      ...prev,
      [target.name]:
        target instanceof HTMLInputElement && target.type === 'checkbox'
          ? target.checked
          : target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'customer',
        acceptTerms: formData.acceptTerms,
      });

      toast.success('تم إنشاء حساب العميل بنجاح');
      navigate('/customer/dashboard', { replace: true });
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors[0]?.msg) {
        toast.error(apiErrors[0].msg);
        return;
      }

      toast.error(error.response?.data?.message || 'فشل إنشاء الحساب');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box auth-box-large">
        <div className="auth-header">
          <h1>إنشاء حساب عميل</h1>
          <p>حساب بسيط وسريع للبحث عن الخدمات والتواصل مع المزودين.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>الاسم</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>اللقب</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="StrongPass1!"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>تأكيد كلمة المرور</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="StrongPass1!"
              disabled={isLoading}
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              disabled={isLoading}
            />
            <label>أوافق على الشروط وسياسة الخصوصية</label>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب العميل'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            لديك حساب؟ <Link to="/login" className="link">دخول</Link>
          </p>
          <p>
            صاحب مهنة؟ <Link to="/join/provider" className="link">انضم كمزود خدمة</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;