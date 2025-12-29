import React, { useRef } from 'react';
import { message } from 'antd';
import { Link, useIntl } from '@umijs/max';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import type { SortOrder } from 'antd/es/table/interface';
import { listIncomeTransactions } from '@/services/insight/incomeTransaction';
import { listBuyerOptions } from '@/services/insight/buyer';
import { listRecipientOptions } from '@/services/insight/recipient';
import { listProductOptions } from '@/services/insight/product';

const CreditTab: React.FC = () => {

    const { formatMessage } = useIntl();
    const actionRef = useRef<ActionType>();

    const columns: ProColumns<INSIGHT_API.IncomeTransactionItem>[] = [
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.keyword' }),
            dataIndex: 'keyword',
            valueType: 'text',
            hideInTable: true,
            hideInSearch: true,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.transaction_id', defaultMessage: 'ID' }),
            dataIndex: 'transaction_id',
            key: 'transaction_id',
            width: 100,
            sorter: true,
            hideInSearch: true,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.transaction_time', defaultMessage: 'Time' }),
            dataIndex: 'transaction_time',
            key: 'transaction_time',
            valueType: 'dateTime',
            width: 160,
            sorter: true,
            hideInSearch: true,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.product', defaultMessage: 'Product' }),
            dataIndex: 'product_id',
            valueType: 'select',
            fieldProps: {
                showSearch: true,
                mode: 'multiple',
                dropdownMatchSelectWidth: false,
            },
            request: async (params: any) => {
                const keyword = (params?.keyWords ?? params?.keyword ?? '').toString();
                try {
                    const resp = await listProductOptions({ keyword: keyword || undefined, limit: 50 });
                    return (resp || []).map((o: any) => ({ label: o.label ?? String(o.value), value: o.value }));
                } catch (e) {
                    return [];
                }
            },
            sorter: true,
            render: (_: any, record: any) => {
                const name = record?.product?.name ?? record?.product_id;
                const id = record?.product?.id ?? record?.product_id;
                return (
                    <Link to={`/business-analysis/products/${id}`}>{name}</Link>
                );
            },
            ellipsis: true,
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.buyer', defaultMessage: 'Buyer' }),
            dataIndex: 'buyer_user_id',
            valueType: 'select',
            fieldProps: {
                showSearch: true,
                mode: 'multiple',
                dropdownMatchSelectWidth: false
            },
            // dynamically load options for the select (search by name or id)
            request: async (params: any) => {
                const keyword = (params?.keyWords ?? params?.keyword ?? '').toString();
                try {
                    const resp = await listBuyerOptions({ keyword: keyword || undefined, limit: 50 });
                    return (resp || []).map((o: any) => ({ label: o.label ?? String(o.value), value: o.value }));
                } catch (e) {
                    return [];
                }
            },
            sorter: true,
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
            dataIndex: 'recipient_user_id',
            valueType: 'select',
            fieldProps: {
                showSearch: true,
                mode: 'multiple',
                dropdownMatchSelectWidth: false,
                debounceTime: 1000,
                debounceSearch: true,
            },
            request: async (params: any) => {
                const keyword = (params?.keyWords ?? params?.keyword ?? '').toString();
                try {
                    const resp = await listRecipientOptions({ keyword: keyword || undefined, limit: 50 });
                    return (resp || []).map((o: any) => ({ label: o.label ?? String(o.value), value: o.value }));
                } catch (e) {
                    return [];
                }
            },
            sorter: true,
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
            hideInSearch: true,
            children: [
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.paid.credits', defaultMessage: 'Credits' }),
                    dataIndex: 'paid_credits',
                    key: 'paid_credits',
                    width: 120,
                    align: 'right',
                    sorter: true,
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.paid.promoCredits', defaultMessage: 'Promo Credits' }),
                    dataIndex: 'paid_promo_credits',
                    key: 'paid_promo_credits',
                    width: 150,
                    align: 'right',
                    sorter: true,
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.paid.totalCredits', defaultMessage: 'Total Credits' }),
                    dataIndex: 'paid_total_credits',
                    key: 'paid_total_credits',
                    width: 150,
                    align: 'right',
                    sorter: true,
                },
            ],
        },
        {
            title: formatMessage({ id: 'businessAnalysis.sales.columns.income', defaultMessage: 'Income' }),
            hideInSearch: true,
            children: [
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.income.credits', defaultMessage: 'Credits' }),
                    dataIndex: 'income_credits',
                    key: 'income_credits',
                    width: 120,
                    align: 'right',
                    sorter: true,
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.income.promoCredits', defaultMessage: 'Promo Credits' }),
                    dataIndex: 'income_promo_credits',
                    key: 'income_promo_credits',
                    width: 150,
                    align: 'right',
                    sorter: true,
                },
                {
                    title: formatMessage({ id: 'businessAnalysis.sales.columns.income.totalCredits', defaultMessage: 'Total Credits' }),
                    dataIndex: 'income_total_credits',
                    key: 'income_total_credits',
                    width: 150,
                    align: 'right',
                    sorter: true,
                },
            ],
        }
    ];

    return (
        <ProTable<INSIGHT_API.IncomeTransactionItem>
            headerTitle={formatMessage({ id: 'businessAnalysis.sales.creditTab.headerTitle', defaultMessage: 'Credit Transactions' })}
            columns={columns}
            rowKey="transaction_id"
            actionRef={actionRef}
            pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
            search={{ filterType: 'light' }}
            request={async (params: any = {}, sort: Record<string, SortOrder | null> = {}) => {
                const { current, pageSize, ...rest } = params as any;

                const order: INSIGHT_API.OrderItem[] = Object.keys(sort).length
                    ? Object.entries(sort).map(([property, direction]) => ({
                        property,
                        direction: direction === 'ascend' ? 'ASC' : direction === 'descend' ? 'DESC' : undefined,
                    }))
                    : [];
                try {
                    const body: INSIGHT_API.PaginationParams = {
                        page: current,
                        page_size: pageSize,
                        orders: order,
                        ...rest,
                    } as unknown as INSIGHT_API.PaginationParams;
                    // @ts-ignore
                    const resp: any = await listIncomeTransactions(body);
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
