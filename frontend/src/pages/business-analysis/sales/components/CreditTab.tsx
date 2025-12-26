import React from 'react';
import { message } from 'antd';
import { Link, useIntl } from '@umijs/max';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { listIncomeTransactions } from '@/services/insight/incomeTransaction';

const CreditTab: React.FC = () => {

    const { formatMessage } = useIntl();

    const columns: ProColumns<INSIGHT_API.IncomeTransactionItem>[] = [
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.transaction_id', defaultMessage: 'ID' }),
            dataIndex: 'transaction_id',
            key: 'transaction_id',
            width: 100,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.transaction_time', defaultMessage: 'Time' }),
            dataIndex: 'transaction_time',
            key: 'transaction_time',
            valueType: 'dateTime',
            width: 160,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.product', defaultMessage: 'Product' }),
            dataIndex: ['product', 'product_name'],
            key: 'product_name',
            render: (_: any, record: any) => {
                const name = record?.product?.product_name ?? record?.product_id;
                const id = record?.product?.product_id ?? record?.product_id;
                return (
                    <Link to={`/business-analysis/products/${id}`}>{name}</Link>
                );
            },
            ellipsis: true,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.buyer', defaultMessage: 'Buyer' }),
            dataIndex: ['buyer_user', 'name'],
            key: 'buyer_name',
            render: (_: any, record: any) => {
                const name = record?.buyer_user?.name ?? record?.buyer_user_id;
                const id = record?.buyer_user?.id ?? record?.buyer_user_id;
                return (
                    <Link to={`/business-analysis/customers/buyers/${id}`}>{name}</Link>
                );
            },
            ellipsis: true,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.recipient', defaultMessage: 'Recipient' }),
            dataIndex: ['recipient_user', 'name'],
            key: 'recipient_name',
            render: (_: any, record: any) => {
                const name = record?.recipient_user?.name ?? record?.recipient_user_id;
                const id = record?.recipient_user?.id ?? record?.recipient_user_id;
                return (
                    <Link to={`/business-analysis/customers/recipients/${id}`}>{name}</Link>
                );
            },
            ellipsis: true,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.paid', defaultMessage: 'Paid' }),
            children: [
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.paid.credits', defaultMessage: 'Credits' }),
                    dataIndex: 'paid_credits',
                    key: 'paid_credits',
                    width: 100,
                    align: 'right',
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.paid.promoCredits', defaultMessage: 'Promo Credits' }),
                    dataIndex: 'paid_promo_credits',
                    key: 'paid_promo_credits',
                    width: 130,
                    align: 'right',
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.paid.totalCredits', defaultMessage: 'Total Credits' }),
                    dataIndex: 'paid_total_credits',
                    key: 'paid_total_credits',
                    width: 120,
                    align: 'right',
                },
            ],
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.income', defaultMessage: 'Income' }),
            children: [
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.income.credits', defaultMessage: 'Credits' }),
                    dataIndex: 'income_credits',
                    key: 'income_credits',
                    width: 100,
                    align: 'right',
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.income.promoCredits', defaultMessage: 'Promo Credits' }),
                    dataIndex: 'income_promo_credits',
                    key: 'income_promo_credits',
                    width: 130,
                    align: 'right',
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.income.totalCredits', defaultMessage: 'Total Credits' }),
                    dataIndex: 'income_total_credits',
                    key: 'income_total_credits',
                    width: 120,
                    align: 'right',
                },
            ],
        }
    ];

    return (
        <ProTable<INSIGHT_API.IncomeTransactionItem>
            headerTitle={formatMessage({ id: 'businessAnalysis.sales.creditTab.headerTitle', defaultMessage: 'Credit Transactions' })}
            columns={columns}
            rowKey="transaction_id"
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
            }}
            search={false}
            request={async (params: any) => {
                const p = params.current || 1;
                const ps = params.pageSize || 50;
                try {
                    // @ts-ignore
                    const resp: any = await listIncomeTransactions({ page: p, page_size: ps });
                    const items = resp?.items || resp?.data || resp?.results || [];
                    const total = resp?.total ?? (Array.isArray(items) ? items.length : 0);
                    return {
                        data: items,
                        total,
                        success: true,
                    };
                } catch (err: any) {
                    message.error(err?.message || formatMessage({ id: 'businessAnalysis.sales.creditTab.loadFailed', defaultMessage: 'Failed to load credit transactions' }));
                    return {
                        data: [],
                        total: 0,
                        success: false,
                    };
                }
            }}

        />
    );
};

export default CreditTab;
