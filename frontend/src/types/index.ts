export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'service_provider' | 'reviewer' | 'admin';
  profileImage?: string;
  phone?: string;
}

export interface AuthResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  provider: {
    id: string;
    companyName: string;
    logo?: string;
  };
  category: string;
  averageRating: number;
  totalReviews: number;
  images?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  service: Service;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  customer: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  createdAt: string;
}