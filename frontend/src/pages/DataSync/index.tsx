import React from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, Upload, Button, Checkbox, Tag, Space, message, Col, Row } from 'antd';
import { InboxOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';

const { Dragger } = Upload;

type HistoryItem = {
    key: string;
    importTime: string;
    type: string;
    fileName: string;
    records: string;
    status: '成功' | '部分失败' | '失败';
};

const DataSync: React.FC = () => {
    const { formatMessage } = useIntl();
    const [form] = Form.useForm();
    const [productFileList, setProductFileList] = React.useState<UploadFile[]>([]);
    const [incomeFileList, setIncomeFileList] = React.useState<UploadFile[]>([]);
    const [history, setHistory] = React.useState<HistoryItem[]>([
        {
            key: '1',
            importTime: '2025-12-20 10:32',
            type: 'Income',
            fileName: 'incomelog.xml',
            records: '12,345',
            status: '成功',
        },
        {
            key: '2',
            importTime: '2025-12-19 21:10',
            type: 'Product',
            fileName: 'productlist.xml',
            records: '1,230',
            status: '部分失败',
        },
    ]);

    React.useEffect(() => {
        if (typeof document === 'undefined') return;
        document.title = `${formatMessage({ id: 'dataSync.pageTitle' })} - ${formatMessage({ id: 'app.name' })}`;
    }, [formatMessage]);

    const handleBeforeUpload = (file: UploadFile, type: 'Product' | 'Income') => {
        if (type === 'Product') {
            setProductFileList([file]);
        } else {
            setIncomeFileList([file]);
        }
        return false; // prevent auto upload
    };

    const handleSubmit = async () => {
        const hasProduct = productFileList.length > 0;
        const hasIncome = incomeFileList.length > 0;
        if (!hasProduct && !hasIncome) {
            message.error(formatMessage({ id: 'dataSync.noFile' }));
            return;
        }

        const chosenType = hasProduct ? 'Product' : 'Income';
        const chosenFile = hasProduct ? productFileList[0] : incomeFileList[0];

        // Simulate an import entry appended to history
        const newItem: HistoryItem = {
            key: String(Date.now()),
            importTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
            type: chosenType,
            fileName: chosenFile.name || 'upload',
            records: '-',
            status: '成功',
        };
        setHistory((h) => [newItem, ...h]);
        message.success(formatMessage({ id: 'dataSync.uploadSuccess' }));
        setProductFileList([]);
        setIncomeFileList([]);
        form.resetFields(['overwrite', 'dryRun']);
    };

    const columns: ProColumns<HistoryItem>[] = [
        { title: formatMessage({ id: 'dataSync.table.importTime' }), dataIndex: 'importTime' },
        { title: formatMessage({ id: 'dataSync.table.type' }), dataIndex: 'type' },
        { title: formatMessage({ id: 'dataSync.table.fileName' }), dataIndex: 'fileName' },
        { title: formatMessage({ id: 'dataSync.table.records' }), dataIndex: 'records' },
        {
            title: formatMessage({ id: 'dataSync.table.status' }),
            dataIndex: 'status',
            render: (s: string) => {
                const color = s === '成功' ? 'green' : s === '部分失败' ? 'orange' : 'red';
                return <Tag color={color as any}>{s}</Tag>;
            },
        },
        {
            title: formatMessage({ id: 'dataSync.table.action' }),
            dataIndex: 'action',
            render: (_: any, record: HistoryItem) => (
                <Space>
                    <a>{formatMessage({ id: 'dataSync.table.view' })}</a>
                    {record.status !== '成功' && <a>{formatMessage({ id: 'dataSync.table.error' })}</a>}
                </Space>
            ),
        },
    ];

    return (
        <PageContainer title={formatMessage({ id: 'dataSync.pageTitle' })}>

            <ProCard
                title={formatMessage({ id: 'dataSync.uploadTitle' })}
                bordered
                bodyStyle={{ padding: 16 }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Dragger
                            accept=".xml,.csv"
                            beforeUpload={(file) => handleBeforeUpload(file, 'Product')}
                            fileList={productFileList}
                            onRemove={() => setProductFileList([])}
                            showUploadList={false}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                {!productFileList.length ? (
                                    <>
                                        <p className="ant-upload-text">
                                            {formatMessage({ id: 'dataSync.type.product' })}
                                        </p>
                                        <p className="ant-upload-hint">{formatMessage({ id: 'dataSync.uploadHint' })}</p>
                                    </>
                                ) : (
                                    <div>
                                        <Space size="small" align="center">
                                            <span style={{ maxWidth: 160, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {productFileList[0]?.name}
                                            </span>
                                            <Button
                                                type="link"
                                                size="small"
                                                icon={<CloseCircleOutlined />}
                                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setProductFileList([]);
                                                }}
                                            />
                                        </Space>
                                    </div>
                                )}
                            </div>
                        </Dragger>
                    </Col>

                    <Col span={12}>
                        <Dragger
                            accept=".xml,.csv"
                            beforeUpload={(file) => handleBeforeUpload(file, 'Income')}
                            fileList={incomeFileList}
                            onRemove={() => setIncomeFileList([])}
                            showUploadList={false}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                {!incomeFileList.length ? (
                                    <>
                                        <p className="ant-upload-text">
                                            {formatMessage({ id: 'dataSync.type.income' })}
                                        </p>
                                        <p className="ant-upload-hint">{formatMessage({ id: 'dataSync.uploadHint' })}</p>
                                    </>
                                ) : (
                                    <div>
                                        <Space size="small" align="center">
                                            <span style={{ maxWidth: 160, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {incomeFileList[0]?.name}
                                            </span>
                                            <Button
                                                type="link"
                                                size="small"
                                                icon={<CloseCircleOutlined />}
                                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setIncomeFileList([]);
                                                }}
                                            />
                                        </Space>
                                    </div>
                                )}
                            </div>
                        </Dragger>
                    </Col>
                </Row>

                <Form form={form} layout="inline" onFinish={handleSubmit} style={{ marginTop: 16 }}>
                    <Form.Item name="overwrite" valuePropName="checked">
                        <Checkbox>{formatMessage({ id: 'dataSync.option.overwrite' })}</Checkbox>
                    </Form.Item>

                    <Form.Item name="dryRun" valuePropName="checked">
                        <Checkbox>{formatMessage({ id: 'dataSync.option.dryRun' })}</Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {formatMessage({ id: 'dataSync.action.import' })}
                        </Button>
                    </Form.Item>
                </Form>
            </ProCard>


            <ProCard title={formatMessage({ id: 'dataSync.tableTitle' })} style={{ padding: 16, marginTop: 16 }} bordered>
                <ProTable<HistoryItem>
                    rowKey="key"
                    columns={columns}
                    dataSource={history}
                    search={false}
                    options={false}
                    pagination={{ pageSize: 10 }}
                />
            </ProCard>

        </PageContainer>
    );
};

export default DataSync;
