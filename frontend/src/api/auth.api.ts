import { request } from './request';
import type { LoginResponse } from './types';

export const authApi = {
  login(name: string, pin: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { name, pin },
    });
  },
};
