// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** List recipient aggregated stats (paginated) Return paginated recipient aggregated stats. POST /recipient/list */
export async function listRecipients(
  body: INSIGHT_API.PaginationParams,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.PaginatedRecipientResponse>(
    `/insight/api/recipient/list`,
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
