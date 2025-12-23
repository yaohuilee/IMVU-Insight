import React from 'react';
import { ProCard, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, Upload, Button, Checkbox, Space, message, Row, Col, Steps, Typography, Alert, Spin } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { HistoryItem } from './types';

const { Dragger } = Upload;
const { Step } = Steps;
const { Text } = Typography;

interface Props {
    onImport: (item: HistoryItem) => void;
}

type PreviewRow = Record<string, any>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function computeHash(file: File) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseXML(content: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        return { error: 'Invalid XML', summary: null, rows: [], columns: [] };
    }
    const root = doc.documentElement;
    const rootAttrs: Record<string, string> = {};
    if (root.attributes && root.attributes.length) {
        Array.from(root.attributes).forEach((attr: Attr) => {
            rootAttrs[attr.name] = attr.value;
        });
    }
    // find repeated child node name
    const nameCounts: Record<string, number> = {};
    for (let i = 0; i < root.children.length; i++) {
        const n = root.children[i].nodeName;
        nameCounts[n] = (nameCounts[n] || 0) + 1;
    }
    const recordName = Object.keys(nameCounts).reduce((a, b) => (nameCounts[a] >= (nameCounts[b] || 0) ? a : b), root.children[0]?.nodeName || '');
    const records = Array.from(root.getElementsByTagName(recordName));
    const rows: PreviewRow[] = records.map(r => {
        const obj: any = {};
        if (r.children && r.children.length) {
            Array.from(r.children).forEach(c => {
                obj[c.nodeName] = c.textContent?.trim() ?? '';
            });
        } else if (r.attributes && r.attributes.length) {
            Array.from(r.attributes).forEach((attr: Attr) => {
                obj[attr.name] = attr.value;
            });
        }
        return obj;
    });
    const columns = rows[0] ? Object.keys(rows[0]).map(key => ({ title: key, dataIndex: key })) : [];
    const summary = { total: records.length, recordName, rootAttrs };
    return { error: null, summary, rows, columns };
}

function parseCSV(content: string) {
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return { error: 'Empty CSV', summary: null, rows: [], columns: [] };
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] ? vals[i].trim() : ''; });
        return obj;
    });
    const columns = headers.map(h => ({ title: h, dataIndex: h }));
    const summary = { total: rows.length, recordName: 'row' };
    return { error: null, summary, rows, columns };
}

function detectTypeFromRows(rows: PreviewRow[], summary: any, fileName?: string): 'Product' | 'Income' {
    // Heuristics:
    // 1. If fileName contains explicit keyword, trust it.
    // 2. Weighted keyword matches on headers/recordName.
    // 3. Check sample values for currency/amount patterns to break ties.
    const fn = (fileName || '').toLowerCase();
    if (fn.includes('product') || fn.includes('productlist') || fn.includes('sku')) return 'Product';
    if (fn.includes('income') || fn.includes('incomelog') || fn.includes('sales') || fn.includes('order')) return 'Income';

    const strongProduct = ['sku', 'price', 'product', 'product_id', 'productname', 'title'];
    const strongIncome = ['amount', 'total', 'income', 'paid', 'payment', 'buyer', 'recipient', 'seller'];
    const weakProduct = ['name', 'id'];
    const weakIncome = ['date', 'time'];

    let p = 0;
    let i = 0;
    const keys = new Set<string>();
    rows.forEach(r => Object.keys(r || {}).forEach(k => keys.add(k.toLowerCase())));
    if (summary && summary.recordName) keys.add(String(summary.recordName).toLowerCase());

    keys.forEach(k => {
        strongProduct.forEach(pk => { if (k.includes(pk)) p += 3; });
        weakProduct.forEach(pk => { if (k.includes(pk)) p += 1; });
        strongIncome.forEach(ik => { if (k.includes(ik)) i += 3; });
        weakIncome.forEach(ik => { if (k.includes(ik)) i += 1; });
    });

    // Inspect sample values for numeric / currency patterns
    const sampleRows = rows.slice(0, 10);
    const currencyRe = /^\s*\d{1,3}(?:[\,\d]{0,})?(?:\.\d{1,2})?\s*$/; // simple numeric with optional decimals
    sampleRows.forEach(r => {
        Object.entries(r).forEach(([k, v]) => {
            const key = String(k).toLowerCase();
            const val = v == null ? '' : String(v).trim();
            if (!val) return;
            if (currencyRe.test(val)) {
                // numeric-like values could be price/amount; decide by header name
                if (key.includes('price') || key.includes('sku') || key.includes('cost')) p += 2;
                if (key.includes('amount') || key.includes('total') || key.includes('income') || key.includes('paid')) i += 2;
            }
            // if value contains buyer/recipient-like keywords, bias income
            if (/buyer|recipient|seller|user|account/i.test(val)) i += 2;
        });
    });

    // final decision
    if (i > p) return 'Income';
    return 'Product';
}

const DataImport: React.FC<Props> = ({ onImport }) => {
    const { formatMessage } = useIntl();
    const [form] = Form.useForm();
    const [current, setCurrent] = React.useState(0);
    const [selectedType, setSelectedType] = React.useState<'Product' | 'Income' | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [fileMeta, setFileMeta] = React.useState<{ name: string; size: number; modified?: number; hash?: string } | null>(null);
    const [computingHash, setComputingHash] = React.useState(false);
    const [parseError, setParseError] = React.useState<string | null>(null);
    const [summary, setSummary] = React.useState<any>(null);
    const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([]);
    const [columns, setColumns] = React.useState<any[]>([]);

    const beforeUpload = (f: UploadFile) => {
        const native = f as unknown as File;
        // validate extension and size
        const name = native.name || '';
        const ext = name.split('.').pop()?.toLowerCase() || '';
        if (!['xml', 'csv'].includes(ext)) {
            message.error(formatMessage({ id: 'dataSync.invalidType' }) || 'Invalid file type');
            return Upload.LIST_IGNORE;
        }
        if (native.size > MAX_FILE_SIZE) {
            message.error(formatMessage({ id: 'dataSync.fileTooLarge' }) || 'File too large');
            return Upload.LIST_IGNORE;
        }
        setFile(native);
        setFileMeta({ name: native.name, size: native.size, modified: native.lastModified });
        // quick detect from filename so UI shows immediate hint
        try {
            const quick = detectTypeFromRows([], null, native.name);
            setSelectedType(quick);
        } catch (e) {
            // ignore
        }
        // compute hash asynchronously and show spinner
        (async () => {
            try {
                setComputingHash(true);
                const h = await computeHash(native);
                setFileMeta(m => m ? { ...m, hash: h, modified: native.lastModified } : { name: native.name, size: native.size, modified: native.lastModified, hash: h });
            } catch (e) {
                console.error('hash error', e);
                message.error(formatMessage({ id: 'dataSync.hashError' }) || 'Failed to compute file hash');
            } finally {
                setComputingHash(false);
            }
        })();
        return Upload.LIST_IGNORE;
    };

    const handleRemove = () => {
        setFile(null);
        setFileMeta(null);
        setSummary(null);
        setPreviewRows([]);
        setColumns([]);
        setParseError(null);
    };

    const handleNextToPreview = async () => {
        if (!file) {
            message.error(formatMessage({ id: 'dataSync.noFile' }) || 'Please choose a file');
            return;
        }
        try {
            setComputingHash(true);
            const hash = await computeHash(file);
            setFileMeta(m => m ? { ...m, hash, modified: file.lastModified } : { name: file.name, size: file.size, modified: file.lastModified, hash });
            const text = await file.text();
            const ext = file.name.split('.').pop()?.toLowerCase();
            let result;
            if (ext === 'xml') result = parseXML(text);
            else result = parseCSV(text);
            if (result.error) {
                setParseError(result.error);
                return;
            }
            setSummary(result.summary);
            setPreviewRows(result.rows.slice(0, 50));
            setColumns(result.columns.map((c: any) => ({ title: c.title, dataIndex: c.dataIndex })));
            // auto-detect type based on parsed rows/summary
            try {
                const detected = detectTypeFromRows(result.rows, result.summary, file?.name);
                setSelectedType(detected);
            } catch (e) {
                setSelectedType(null);
            }
            setCurrent(1);
        } catch (e) {
            setParseError(String(e));
        } finally {
            setComputingHash(false);
        }
    };

    const handleConfirmImport = async () => {
        const values = await form.validateFields();
        const newItem: HistoryItem = {
            key: String(Date.now()),
            importTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
            type: selectedType || 'Product',
            fileName: fileMeta?.name || 'upload',
            records: summary ? String(summary.total) : '-',
            status: 'Success',
        };
        onImport(newItem);
        message.success(formatMessage({ id: 'dataSync.uploadSuccess' }) || 'Import scheduled');
        // reset
        setCurrent(0);
        setFile(null);
        setFileMeta(null);
        form.resetFields();
    };

    const step1 = (
        <ProCard bordered bodyStyle={{ padding: 16 }}>
            <Row gutter={16}>
                <Col span={24}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                            <Text strong>{formatMessage({ id: 'dataSync.selectHint' })}</Text>
                            {selectedType && <div style={{ marginTop: 8 }}><Text type="secondary">Detected: </Text><Text code>{selectedType}</Text></div>}
                        </div>

                        <Dragger accept=".xml,.csv" beforeUpload={beforeUpload} fileList={file ? [{ uid: '1', name: file.name, size: file.size }] : []} onRemove={handleRemove} showUploadList={false}>
                            <div style={{ textAlign: 'center' }}>
                                {!file ? (
                                    <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                ) : null}
                                {!file ? (
                                    <p className="ant-upload-text">{formatMessage({ id: 'dataSync.uploadHint' })}</p>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0, flex: '0 0 auto' }}>
                                            <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                            <div style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                <Text strong>{file.name}</Text>
                                            </div>
                                        </div>
                                        <div style={{ marginLeft: 16, textAlign: 'left' }}>
                                            <div><Text type="secondary">{Math.round((file.size / 1024) * 100) / 100} KB</Text></div>
                                            <div style={{ marginTop: 4 }}>
                                                <Text type="secondary">{file?.lastModified ? new Date(file.lastModified).toLocaleString() : (fileMeta?.modified ? new Date(fileMeta.modified).toLocaleString() : '')}</Text>
                                            </div>
                                            {fileMeta?.hash && (
                                                <div style={{ marginTop: 8 }}>
                                                    <Text type="secondary">Hash (SHA-256): </Text>
                                                    <Text code style={{ wordBreak: 'break-all' }}>{fileMeta.hash}</Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Dragger>
                    </Space>
                </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                {computingHash && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spin size="small" />
                        <Text type="secondary">{formatMessage({ id: 'dataSync.hashing' }) || 'Computing file hash...'}</Text>
                    </span>
                )}
                <Button type="primary" onClick={handleNextToPreview} disabled={computingHash}>{formatMessage({ id: 'dataSync.action.next' }) || 'Next'}</Button>
            </div>
        </ProCard>
    );

    const step2 = (
        <ProCard bordered bodyStyle={{ padding: 16 }}>
            {parseError && <Alert type="error" message={parseError} />}
            {!parseError && summary && (
                <div>
                    <div style={{ marginBottom: 12 }}>
                        <Row gutter={16} style={{ marginTop: 8 }}>
                            <Col xs={24} md={12}>
                                <Text strong>Summary:</Text>
                                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                                    <div><Text>Total records: </Text><Text code>{summary.total}</Text></div>
                                    <div><Text>Record node: </Text><Text code>{summary.recordName}</Text></div>
                                </div>
                            </Col>
                            <Col xs={24} md={12} style={{ textAlign: 'left' }}>
                                <Text strong style={{ marginRight: 8 }}>Attributes:</Text>
                                {summary.rootAttrs && Object.keys(summary.rootAttrs).length > 0 && (
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {summary.rootAttrs.start_date && summary.rootAttrs.end_date ? (
                                            <div style={{ whiteSpace: 'nowrap' }}>
                                                <Text>start_date: </Text><Text code>{summary.rootAttrs.start_date}</Text>
                                                <Text style={{ margin: '0 8px' }}>—</Text>
                                                <Text>end_date: </Text><Text code>{summary.rootAttrs.end_date}</Text>
                                            </div>
                                        ) : null}
                                        {Object.entries(summary.rootAttrs).filter(([k]) => k !== 'start_date' && k !== 'end_date').map(([k, v]) => (
                                            <div key={k} style={{ whiteSpace: 'nowrap' }}><Text>{k}: </Text><Text code>{v}</Text></div>
                                        ))}
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <ProTable<PreviewRow>
                            rowKey={(r) => JSON.stringify(r).slice(0, 36)}
                            search={false}
                            pagination={{ pageSize: 10 }}
                            dataSource={previewRows}
                            columns={columns.map(c => ({ title: c.title, dataIndex: c.dataIndex }))}
                            options={false}
                            scroll={{ x: 'max-content' }}
                        />
                    </div>
                </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setCurrent(0)}>{formatMessage({ id: 'dataSync.action.back' }) || 'Back'}</Button>
                <Button type="primary" onClick={() => setCurrent(2)} disabled={!summary}>{formatMessage({ id: 'dataSync.action.next' }) || 'Next'}</Button>
            </div>
        </ProCard>
    );

    const step3 = (
        <ProCard bordered bodyStyle={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
                <Text strong>Summary (Read-only):</Text>
                <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col xs={24} md={12}>
                        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                            <div><Text>Total records: </Text><Text code>{summary?.total ?? '-'}</Text></div>
                            <div><Text>Record node: </Text><Text code>{summary?.recordName ?? '-'}</Text></div>
                        </div>
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: 'left' }}>
                        {summary?.rootAttrs && Object.keys(summary.rootAttrs).length > 0 && (
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap' }}>
                                <Text strong style={{ marginRight: 8 }}>Attributes:</Text>
                                {summary.rootAttrs.start_date && summary.rootAttrs.end_date ? (
                                    <div style={{ whiteSpace: 'nowrap' }}>
                                        <Text>start_date: </Text><Text code>{summary.rootAttrs.start_date}</Text>
                                        <Text style={{ margin: '0 8px' }}>—</Text>
                                        <Text>end_date: </Text><Text code>{summary.rootAttrs.end_date}</Text>
                                    </div>
                                ) : null}
                                {Object.entries(summary.rootAttrs).filter(([k]) => k !== 'start_date' && k !== 'end_date').map(([k, v]) => (
                                    <div key={k} style={{ whiteSpace: 'nowrap' }}><Text>{k}: </Text><Text code>{v}</Text></div>
                                ))}
                            </div>
                        )}
                    </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                    <Alert type="warning" showIcon message={formatMessage({ id: 'dataSync.warning.overwrite' }) || 'Overwrite will replace existing snapshot and cannot be recovered.'} />
                </div>
            </div>

            <Form form={form} layout="vertical">
                <Form.Item name="overwrite" valuePropName="checked">
                    <Checkbox>{formatMessage({ id: 'dataSync.option.overwrite' })}</Checkbox>
                </Form.Item>
                <Form.Item name="dryRun" valuePropName="checked">
                    <Checkbox>{formatMessage({ id: 'dataSync.option.dryRun' })}</Checkbox>
                </Form.Item>
            </Form>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setCurrent(1)}>{formatMessage({ id: 'dataSync.action.back' }) || 'Back'}</Button>
                <Space>
                    <Button onClick={() => setCurrent(0)}>{formatMessage({ id: 'dataSync.action.modify' }) || 'Back to Modify'}</Button>
                    <Button type="primary" onClick={handleConfirmImport}>{formatMessage({ id: 'dataSync.action.confirm' }) || 'Confirm Import'}</Button>
                </Space>
            </div>
        </ProCard>
    );

    return (
        <div>
            <Steps current={current} style={{ marginBottom: 16 }}>
                <Step title={formatMessage({ id: 'dataSync.step.select' }) || 'Select'} description={formatMessage({ id: 'dataSync.step.select.desc' })} />
                <Step title={formatMessage({ id: 'dataSync.step.preview' }) || 'Preview'} description={formatMessage({ id: 'dataSync.step.preview.desc' })} />
                <Step title={formatMessage({ id: 'dataSync.step.confirm' }) || 'Confirm'} description={formatMessage({ id: 'dataSync.step.confirm.desc' })} />
            </Steps>

            {current === 0 && step1}
            {current === 1 && step2}
            {current === 2 && step3}
        </div>
    );
};

export default DataImport;
