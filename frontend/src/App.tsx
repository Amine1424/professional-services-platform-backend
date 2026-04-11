import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './store/store';

import ProtectedRoute from './components/ProtectedRoute';
import RoleShell from './components/RoleShell';
import ReviewerProviderReview from './pages/ReviewerProviderReview';
import ReviewerProfile from './pages/ReviewerProfile';
import AdminUsers from './pages/AdminUsers';
import AdminContent from './pages/AdminContent';
import AdminReviewers from './pages/AdminReviewers';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import CustomerRegister from './pages/CustomerRegister';
import ProviderRegister from './pages/ProviderRegister';

import PublicProviderPage from './pages/PublicProviderPage';
import CustomerOrders from './pages/CustomerOrders';
import ProviderRequests from './pages/ProviderRequests';
import CustomerHome from './pages/CustomerHome';
import CustomerExplore from './pages/CustomerExplore';
import CustomerFavorites from './pages/CustomerFavorites';
import CustomerProfile from './pages/CustomerProfile';
import CustomerSubscriptions from './pages/CustomerSubscriptions';
import CustomerReviews from './pages/CustomerReviews';
import CustomerNotifications from './pages/CustomerNotifications';
import CustomerMessages from './pages/CustomerMessages';
import Home from './pages/Home';
import ProviderNotifications from './pages/ProviderNotifications';

import ProviderDashboard from './pages/ProviderDashboard';
import ProviderProfile from './pages/ProviderProfile';
import ProviderServices from './pages/ProviderServices';
import ProviderPortfolio from './pages/ProviderPortfolio';
import ProviderMessages from './pages/ProviderMessages';
import ProviderSubscription from './pages/ProviderSubscription';
import ProviderSettings from './pages/ProviderSettings';

import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewerPending from './pages/ReviewerPending';
import ReviewerHistory from './pages/ReviewerHistory';

import AdminDashboard from './pages/AdminDashboard';
import AdminProviders from './pages/AdminProviders';
import AdminCategories from './pages/AdminCategories';

import AdminRegions from './pages/AdminRegions';
import AdminReports from './pages/AdminReports';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

export const App: React.FC = () => {
  return (
    <Provider store={store}>

      <Router>



        <Routes>
          <Route path="/" element={<Home />} />
         
          <Route path="/login" element={<Login />} />
          <Route path="/join/customer" element={<CustomerRegister />} />
          <Route path="/join/provider" element={<ProviderRegister />} />

          <Route path="/providers/:id" element={<PublicProviderPage />} />
<Route
  path="/admin/regions"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <RoleShell
        role="admin"
        title="إدارة المناطق"
        subtitle="CRUD للجهات والولايات."
      >
        <AdminRegions />
      </RoleShell>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/reports"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <RoleShell
        role="admin"
        title="التقارير والإحصائيات"
        subtitle="KPIs + تصدير Excel و PDF."
      >
        <AdminReports />
      </RoleShell>
    </ProtectedRoute>
  }
/>
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="الرئيسية"
                  subtitle="Feed مخصص + عروض مميزة + وسائط حديثة."
                >
                  <CustomerHome />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/explore"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="الاستكشاف"
                  subtitle="بحث حسب الجهة والولاية والفئة والكلمات المفتاحية."
                >
                  <CustomerExplore />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/messages"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="المحادثات"
                  subtitle="كل المحادثات الفورية مع أصحاب الخدمات."
                >
                  <CustomerMessages />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="طلباتي"
                  subtitle="كل طلبات الخدمة والعروض والاقتباسات."
                >
                  <CustomerOrders />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/favorites"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="المفضلة"
                  subtitle="كل الصفحات التي قمت بحفظها."
                >
                  <CustomerFavorites />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="الإشعارات"
                  subtitle="آخر التحديثات من الصفحات التي تتابعها."
                >
                  <CustomerNotifications />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/reviews"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="تقييماتي"
                  subtitle="كل تقييماتك السابقة للمزودين."
                >
                  <CustomerReviews />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/subscriptions"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="الاشتراكات"
                  subtitle="اختيار الخطة المناسبة للعميل."
                >
                  <CustomerSubscriptions />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RoleShell
                  role="customer"
                  title="ملفي الشخصي"
                  subtitle="تعديل المعلومات والاهتمامات وكلمة المرور."
                >
                  <CustomerProfile />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="لوحة المزود"
                  subtitle="نظرة عملية على الحساب المهني، الخدمات، الرسائل، والمزايا."
                >
                  <ProviderDashboard />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/profile"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الملف المهني"
                  subtitle="إدارة بيانات النشاط، الصور، الموقع، والخبرة."
                >
                  <ProviderProfile />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/services"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الخدمات"
                  subtitle="إضافة، تعديل، حذف، ونشر الخدمات + البادجات والعروض."
                >
                  <ProviderServices />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/portfolio"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الأعمال والوسائط"
                  subtitle="إدارة الصور والفيديوهات الترويجية، التفاعل، والستيكرات."
                >
                  <ProviderPortfolio />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/requests"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الطلبات"
                  subtitle="إدارة Leads / Quotes / Service Requests الواردة من العملاء."
                >
                  <ProviderRequests />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/messages"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الرسائل + الرد الذكي"
                  subtitle="مولد ردود ذكي مبني على الخدمات والوصف المهني."
                >
                  <ProviderMessages />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/notifications"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الإشعارات"
                  subtitle="كل التحديثات الخاصة بالرسائل والطلبات والتفاعل على حسابك."
                >
                  <ProviderNotifications />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/subscription"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الاشتراك والمزايا"
                  subtitle="اختيار الخطة وتفعيل مزايا الظهور والبادجات."
                >
                  <ProviderSubscription />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/settings"
            element={
              <ProtectedRoute allowedRoles={['service_provider']}>
                <RoleShell
                  role="service_provider"
                  title="الإعدادات والخصوصية"
                  subtitle="المعلومات الشخصية، الخصوصية، والأمان."
                >
                  <ProviderSettings />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reviewer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['reviewer']}>
                <RoleShell
                  role="reviewer"
                  title="لوحة المراجع"
                  subtitle="الطلبات المعلقة، الإحصائيات، وسير العمل اليومي."
                >
                  <ReviewerDashboard />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reviewer/pending"
            element={
              <ProtectedRoute allowedRoles={['reviewer']}>
                <RoleShell
                  role="reviewer"
                  title="الطلبات المعلقة"
                  subtitle="فحص الحسابات المهنية الجديدة واتخاذ القرار."
                >
                  <ReviewerPending />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reviewer/history"
            element={
              <ProtectedRoute allowedRoles={['reviewer']}>
                <RoleShell
                  role="reviewer"
                  title="سجل المراجعات"
                  subtitle="كل الحسابات التي تم اتخاذ قرار بشأنها."
                >
                  <ReviewerHistory />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <RoleShell
                  role="admin"
                  title="لوحة الإدارة"
                  subtitle="نظرة عامة على المنصة والمزودين والفئات والخدمات."
                >
                  <AdminDashboard />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/providers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <RoleShell
                  role="admin"
                  title="إدارة المزودين"
                  subtitle="فحص ومتابعة الحسابات المهنية."
                >
                  <AdminProviders />
                </RoleShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <RoleShell
                  role="admin"
                  title="إدارة الفئات"
                  subtitle="إضافة وتعديل وحذف الفئات الرئيسية والفرعية."
                >
                  <AdminCategories />
                </RoleShell>
              </ProtectedRoute>
            }
          />
          <Route
  path="/reviewer/providers/:id"
  element={
    <ProtectedRoute allowedRoles={['reviewer']}>
      <RoleShell
        role="reviewer"
        title="مراجعة الحساب"
        subtitle="عرض كامل لبروفايل المزود واتخاذ القرار."
      >
        <ReviewerProviderReview />
      </RoleShell>
    </ProtectedRoute>
  }
/>

<Route
  path="/reviewer/profile"
  element={
    <ProtectedRoute allowedRoles={['reviewer']}>
      <RoleShell
        role="reviewer"
        title="ملفي"
        subtitle="بياناتي وإحصائياتي كمراجع."
      >
        <ReviewerProfile />
      </RoleShell>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <RoleShell
        role="admin"
        title="إدارة المستخدمين"
        subtitle="فلترة، بحث، تفعيل، تعطيل، وتغيير الأدوار."
      >
        <AdminUsers />
      </RoleShell>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/content"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <RoleShell
        role="admin"
        title="إدارة المحتوى"
        subtitle="مراقبة التعليقات والمحتوى المخالف."
      >
        <AdminContent />
      </RoleShell>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/reviewers"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <RoleShell
        role="admin"
        title="إدارة المراجعين"
        subtitle="إضافة المراجعين ومتابعة حالتهم."
      >
        <AdminReviewers />
      </RoleShell>
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/settings"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <RoleShell
        role="admin"
        title="الإعدادات العامة"
        subtitle="SEO، إشعارات النظام، ووضع الصيانة."
      >
        <AdminSettings />
      </RoleShell>
    </ProtectedRoute>
  }
/>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </Provider>
  );
};

export default App;
