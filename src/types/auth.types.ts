export interface IRegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'service_provider';
  phone?: string;
  acceptTerms: boolean;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IAuthResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface IPasswordResetPayload {
  email: string;
}

export interface IPasswordResetConfirmPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}