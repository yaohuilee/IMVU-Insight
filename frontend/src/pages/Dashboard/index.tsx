import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';

const Dashboard: React.FC = () => {
    const { formatMessage } = useIntl();

    React.useEffect(() => {
        if (typeof document === 'undefined') return;
        document.title = `${formatMessage({ id: 'dashboard.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;
    }, [formatMessage]);

    return <PageContainer title={formatMessage({ id: 'dashboard.pageTitle' })} />;
}

export default Dashboard;