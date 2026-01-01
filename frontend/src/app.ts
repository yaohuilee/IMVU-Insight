import { RunTimeLayoutConfig } from '@umijs/max';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import AccountMenu from '@/components/AccountMenu';

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
