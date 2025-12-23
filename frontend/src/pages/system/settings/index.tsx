import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';

const Settings: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'system.settings.pageTitle', defaultMessage: 'System Settings' })} - ${formatMessage({ id: 'app.name', defaultMessage: 'IMVU Insight' })}`;

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer title={formatMessage({ id: 'system.settings.pageTitle', defaultMessage: 'System Settings' })} />
		</>
	);
};

export default Settings;
