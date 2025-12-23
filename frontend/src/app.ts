import { RunTimeLayoutConfig, SelectLang } from '@umijs/max';
import React from 'react';

export { request } from '@/services/request';

export const layout: RunTimeLayoutConfig = ({ }) => {
  return {
    title: 'IMVU Insight',
    layout: 'side',
    menu: {
      locale: true,
    },
    rightContentRender: () => React.createElement(SelectLang),
  };
};
