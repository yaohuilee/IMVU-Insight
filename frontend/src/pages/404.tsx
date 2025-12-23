import { history } from '@umijs/max';
import { useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet-async';

const NoFoundPage: React.FC = () => {
  const { formatMessage } = useIntl();

  const title = `${formatMessage({ id: 'notFound.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <Result
        status="404"
        title="404"
        subTitle={formatMessage({ id: 'notFound.subTitle' })}
        extra={
          <Button type="primary" onClick={() => history.push('/')}
          >
            {formatMessage({ id: 'notFound.backHome' })}
          </Button>
        }
      />
    </>
  );
};

export default NoFoundPage;
