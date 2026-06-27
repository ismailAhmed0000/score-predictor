import { redirect } from '@tanstack/react-router';
import { clearToken, getUser, isLoggedIn } from '../api/client';

export function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    const user = getUser();
    throw redirect({ to: user?.isAdmin ? '/admin' : '/matches' });
  }
}

export function requireAuth() {
  if (!isLoggedIn()) {
    throw redirect({ to: '/login' });
  }
}

export function requireAdmin() {
  if (!isLoggedIn()) {
    throw redirect({ to: '/login' });
  }
  const user = getUser();
  if (!user?.isAdmin) {
    throw redirect({ to: '/matches' });
  }
}

export function logout() {
  clearToken();
  window.location.href = '/login';
}
