import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';
import { Segmented } from 'antd';

import CreditTab from './components/CreditTab';
import CashTab from './components/CashTab';


const Sales: React.FC = () => {
	const { formatMessage } = useIntl();
	const [active, setActive] = useState<'credit' | 'cash'>('credit');

	const title = `${formatMessage({ id: 'businessAnalysis.sales.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

	return (
		<>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<PageContainer
				title={formatMessage({ id: 'businessAnalysis.sales.pageTitle' })}
				extra={
					<Segmented
						options={[
							{ label: formatMessage({ id: 'businessAnalysis.sales.creditTab', defaultMessage: 'Credit' }), value: 'credit' },
							{ label: formatMessage({ id: 'businessAnalysis.sales.cashTab', defaultMessage: 'Cash' }), value: 'cash' },
						]}
						value={active}
						onChange={(v) => setActive(v as 'credit' | 'cash')}
					/>
				}
			>
				{active === 'credit' ? <CreditTab /> : <CashTab />}
			</PageContainer>
		</>
	);
};

export default Sales;
