import { RunTimeLayoutConfig, SelectLang } from '@umijs/max';
import React from 'react';

export const layout: RunTimeLayoutConfig = ({ }) => {
  return {
    title: 'IMVU Insight',
    layout: 'side',
    rightContentRender: () => React.createElement(SelectLang),
  };
};
