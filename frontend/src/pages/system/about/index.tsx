import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';

const About: React.FC = () => {
	const { formatMessage } = useIntl();

	const title = `${formatMessage({ id: 'system.about.pageTitle', defaultMessage: 'About System' })} - ${formatMessage({ id: 'app.name', defaultMessage: 'IMVU Insight' })}`;

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer title={formatMessage({ id: 'system.about.pageTitle', defaultMessage: 'About System' })} />
		</>
	);
};

export default About;
