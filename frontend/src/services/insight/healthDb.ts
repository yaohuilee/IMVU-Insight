// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Health Db GET /health/db */
export async function healthDb(options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/insight/api/health/db`, {
    method: 'GET',
    ...(options || {}),
  });
}
