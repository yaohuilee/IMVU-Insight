import { RunTimeLayoutConfig, history } from '@umijs/max';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import AccountMenu from '@/components/AccountMenu';
import { currentUser as fetchCurrentUser } from '@/services/insight/auth';
import { request as requestConfig } from '@/services/request';

const loginPath = '/login';

export async function getInitialState(): Promise<{
  currentUser?: INSIGHT_API.UserOut | null;
  fetchUserInfo?: () => Promise<INSIGHT_API.UserOut | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      return await fetchCurrentUser();
    } catch (error: any) {
      const status = error?.response?.status;
      if ((status === 401 || status === 404) && history.location?.pathname !== loginPath) {
        const redirect = history.location?.pathname || '/';
        history.push(`${loginPath}?redirect=${encodeURIComponent(redirect)}`);
      }
      return undefined;
    }
  };

  if (history.location?.pathname === loginPath) {
    return { fetchUserInfo, currentUser: null };
  }

  const user = await fetchUserInfo();
  return {
    fetchUserInfo,
    currentUser: user ?? null,
  };
}

export const layout: RunTimeLayoutConfig = ({ }) => {
  return {
    title: 'IMVU Insight',
    layout: 'side',
    menu: {
      locale: true,
    },
    rightContentRender: (props) => React.createElement(AccountMenu, { collapsed: props?.collapsed }),
  };
};

export const rootContainer = (container: React.ReactNode) => {
  return React.createElement(HelmetProvider, null, container);
};

export const request = requestConfig;
