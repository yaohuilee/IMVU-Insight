import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useParams, useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';

const ImvuUserDetail: React.FC = () => {
  const { id } = useParams();
  const { formatMessage } = useIntl();
  const title = `${formatMessage({ id: 'imvuGraph.users.detail.pageTitle' })} - ${id}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageContainer title={formatMessage({ id: 'imvuGraph.users.detail.pageTitle' })}>
        <div>{formatMessage({ id: 'imvuGraph.users.detail.idLabel' }, { id })}</div>
        <div>{formatMessage({ id: 'imvuGraph.users.detail.placeholder' })}</div>
      </PageContainer>
    </>
  );
};

export default ImvuUserDetail;
