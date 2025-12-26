import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useParams, useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';

const BuyerDetail: React.FC = () => {
  const { id } = useParams();
  const { formatMessage } = useIntl();
  const title = `${formatMessage({ id: 'businessAnalysis.customers.buyers.detail.pageTitle' })} - ${id}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageContainer title={formatMessage({ id: 'businessAnalysis.customers.buyers.detail.pageTitle' })}>
        <div>{formatMessage({ id: 'businessAnalysis.customers.buyers.detail.idLabel' }, { id })}</div>
        <div>{formatMessage({ id: 'businessAnalysis.customers.buyers.detail.placeholder' })}</div>
      </PageContainer>
    </>
  );
};

export default BuyerDetail;
