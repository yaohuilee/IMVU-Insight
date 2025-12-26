// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List ImvuUser objects (paginated) Return paginated imvu users (summary fields). POST /imvu_user/list */
export async function listImvuUsers(
  body: INSIGHT_API.PaginationParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedImvuUserResponse>(
    `/insight/api/imvu_user/list`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}
