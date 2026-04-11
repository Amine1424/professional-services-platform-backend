import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

export const ProviderRegister: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;

    setFormData((prev) => ({
      ...prev,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        companyName: formData.companyName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'service_provider',
        acceptTerms: formData.acceptTerms,
      });

      toast.success('تم إنشاء حساب المزود بنجاح');
      navigate('/provider/profile', { replace: true });
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors[0]?.msg) {
        toast.error(apiErrors[0].msg);
        return;
      }

      toast.error(error.response?.data?.message || 'فشل إنشاء حساب المزود');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box auth-box-large" style={{ maxWidth: 700 }}>
        <div className="auth-header">
          <h1>انضم كمزود خدمة / صاحب مهنة</h1>
          <p>
            هذا المسار مخصص للحرفيين، أصحاب الأعمال، المستقلين، والشركات.
          </p>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>اسم النشاط / المؤسسة</label>
              <input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Amine Services"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>رقم الهاتف</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0555555555"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني المهني</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
            {isLoading ? 'جاري إنشاء الحساب...' : 'الانضمام كمزود خدمة'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            لديك حساب بالفعل؟ <Link to="/login" className="link">دخول</Link>
          </p>
          <p>
            تريد حساب عميل؟ <Link to="/join/customer" className="link">إنشاء حساب عميل</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderRegister;