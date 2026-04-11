export type PublicRegisterRole = 'customer' | 'service_provider';
export type AppUserRole =
  | 'customer'
  | 'service_provider'
  | 'reviewer'
  | 'admin'
  | 'super_admin';

export interface IRegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: PublicRegisterRole;
  phone?: string;
  companyName?: string;
  acceptTerms: boolean | string;
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
      role: AppUserRole;
      phoneNumber?: string | null;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: AppUserRole;
}

export interface IPasswordResetPayload {
  email: string;
}

export interface IPasswordResetConfirmPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}