import React from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Helmet } from 'react-helmet-async';
import { Tabs } from 'antd';
import DataImport from './components/DataImport';
import ImportHistory from './components/ImportHistory';
import type { HistoryItem } from './components/types';

const DataSync: React.FC = () => {
    const { formatMessage } = useIntl();
    const [history, setHistory] = React.useState<HistoryItem[]>([
        {
            key: '1',
            importTime: '2025-12-20 10:32',
            type: 'Income',
            fileName: 'incomelog.xml',
            records: '12,345',
            status: 'Success',
        },
        {
            key: '2',
            importTime: '2025-12-19 21:10',
            type: 'Product',
            fileName: 'productlist.xml',
            records: '1,230',
            status: 'Partial Failure',
        },
    ]);

    const title = `${formatMessage({ id: 'dataSync.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;

    const handleAddHistory = (item: HistoryItem) => {
        setHistory((h) => [item, ...h]);
    };

    return (
        <>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <PageContainer title={formatMessage({ id: 'dataSync.pageTitle' })} >
                <ProCard bordered>
                    <Tabs
                        items={[
                            {
                                key: 'import',
                                label: formatMessage({ id: 'dataSync.uploadTitle' }),
                                children: <DataImport onImport={handleAddHistory} />,
                            },
                            {
                                key: 'history',
                                label: formatMessage({ id: 'dataSync.tableTitle' }),
                                children: <ImportHistory history={history} />,
                            },
                        ]}
                    />
                </ProCard>
            </PageContainer>
        </>
    );
};

export default DataSync;
