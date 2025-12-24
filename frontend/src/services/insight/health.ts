// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Health GET /health */
export async function health(options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/insight/api/health`, {
    method: 'GET',
    ...(options || {}),
  });
}
