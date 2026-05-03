import type { User, Session } from '@supabase/supabase-js';
import type { ProfileRow } from './supabase';

export interface AuthOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SignInWithIdentifierInput {
  identifier: string;
  password: string;
}

export interface RegisterUserInput {
  fullName: string;
  phone: string;
  password: string;
}

export interface RegisterAgencyInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyAgencyOtpInput {
  email: string;
  otpCode: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface AuthSnapshot {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  pendingDeletion: boolean;
  roleResolved: boolean;
}
