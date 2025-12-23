import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';
import { Helmet } from 'react-helmet-async';

const Dashboard: React.FC = () => {
    const { formatMessage } = useIntl();

    const title = `${formatMessage({ id: 'dashboard.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

    return (
        <>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <PageContainer title={formatMessage({ id: 'dashboard.pageTitle' })} />
        </>
    );
}

export default Dashboard;