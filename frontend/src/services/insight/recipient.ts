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

/** List recipient options for select inputs Return select options for recipients. If `keyword` provided, search users by name or id.
Otherwise return the most-recent recipients by payment time. POST /recipient/options */
export async function listRecipientOptions(
  body: INSIGHT_API.RecipientOptionsRequest,
  options?: { [key: string]: any },
) {
  return request<INSIGHT_API.RecipientOption[]>(
    `/insight/api/recipient/options`,
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
