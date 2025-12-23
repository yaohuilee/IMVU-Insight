import { history } from '@umijs/max';
import { useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';

const NoFoundPage: React.FC = () => {
  const { formatMessage } = useIntl();

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = `${formatMessage({ id: 'notFound.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;
  }, [formatMessage]);

  return (
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
  );
};

export default NoFoundPage;
