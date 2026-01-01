// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Authenticate user POST /auth/login */
export async function login(
  body: INSIGHT_API.LoginRequest,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.LoginResponse>(`/insight/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get current authenticated user GET /auth/me */
export async function currentUser(options?: { [key: string]: any }) {
  return request<INSIGHT_API.UserOut>(`/insight/api/auth/me`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** Refresh access token POST /auth/refresh */
export async function refresh(
  body: INSIGHT_API.RefreshRequest,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.RefreshResponse>(`/insight/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
