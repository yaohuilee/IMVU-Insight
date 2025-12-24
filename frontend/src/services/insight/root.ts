// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Root GET / */
export async function root(options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/insight/api/`, {
    method: 'GET',
    ...(options || {}),
  });
}
