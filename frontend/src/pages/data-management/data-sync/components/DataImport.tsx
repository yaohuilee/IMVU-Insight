import React from 'react';
import { useIntl } from '@umijs/max';
import { Form, message, Steps, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';

const { Step } = Steps;
import StepSelect from './StepSelect';
import StepPreview from './StepPreview';
import StepConfirm from './StepConfirm';
import { importProductFile, importIncomeFile, getDataSyncRecordByHash } from '@/services/insight/dataSync';

interface Props {
    onImport: () => void;
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
    const currencyRe = /^\s*\d{1,3}(?:[,\d]{0,})?(?:\.\d{1,2})?\s*$/; // simple numeric with optional decimals
    sampleRows.forEach(r => {
        Object.entries(r).forEach(([k, v]) => {
            const key = String(k).toLowerCase();
            const val = v === null ? '' : String(v).trim();
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
            message.error(formatMessage({ id: 'dataSync.invalidType' }));
            return Upload.LIST_IGNORE;
        }
        if (native.size > MAX_FILE_SIZE) {
            message.error(formatMessage({ id: 'dataSync.fileTooLarge' }));
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
                message.error(formatMessage({ id: 'dataSync.hashError' }));
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
        setSelectedType(null);
    };

    React.useEffect(() => {
        if (current === 0) {
            handleRemove();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);
    const handleNextToPreview = async () => {
        if (!file) {
            message.error(formatMessage({ id: 'dataSync.noFile' }));
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
        if (!file || !selectedType) {
            message.error('No file or type selected');
            return;
        }
        // 获取表单参数
        const values = await form.validateFields();
        // 在实际上传之前，检查 hash 是否存在已上传的记录
        try {
            let hash = fileMeta?.hash;
            if (!hash) {
                setComputingHash(true);
                hash = await computeHash(file);
                setFileMeta((m) =>
                    m ? { ...m, hash, modified: file.lastModified } : { name: file.name, size: file.size, modified: file.lastModified, hash },
                );
                setComputingHash(false);
            }
            if (hash) {
                const resp = await getDataSyncRecordByHash({ hash });
                if (resp && (resp as any).exists) {
                    const record = (resp as any).record as any;
                    const typeKey = record?.type === 'income' ? 'income' : 'product';
                    const displayType = formatMessage({ id: `dataSync.type.${typeKey}` });
                    const uploadedAt = record?.uploaded_at ? new Date(record.uploaded_at).toLocaleString() : '';
                    const recordCount = record?.record_count ?? '';
                    const fileSizeBytes = record?.file_size ?? 0;
                    const fileSize = fileSizeBytes >= 1024 * 1024
                        ? `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                        : `${(fileSizeBytes / 1024).toFixed(2)} KB`;
                    message.warning(
                        formatMessage(
                            { id: 'dataSync.duplicateFile' },
                            { type: displayType, uploadedAt, recordCount, fileSize },
                        ),
                    );
                    return;
                }
            }
        } catch (e) {
            setComputingHash(false);
            message.error(formatMessage({ id: 'dataSync.checkFailed' }));
            return;
        }
        
        try {
            if (selectedType === 'Product') {
                await importProductFile(values, file);
            } else if (selectedType === 'Income') {
                await importIncomeFile(values, file);
            } else {
                message.error(formatMessage({ id: 'dataSync.invalidType' }));
                return;
            }

            onImport();
            message.success(formatMessage({ id: 'dataSync.uploadSuccess' }));
        } catch (e: any) {
            message.error(e?.message || 'Import failed');
        }
        // reset
        setCurrent(0);
        setFile(null);
        setFileMeta(null);
        form.resetFields();
    };

    return (
        <div>
            <Steps current={current} style={{ marginBottom: 16 }}>
                <Step title={formatMessage({ id: 'dataSync.step.select' })} description={formatMessage({ id: 'dataSync.step.select.desc' })} />
                <Step title={formatMessage({ id: 'dataSync.step.preview' })} description={formatMessage({ id: 'dataSync.step.preview.desc' })} />
                <Step title={formatMessage({ id: 'dataSync.step.confirm' })} description={formatMessage({ id: 'dataSync.step.confirm.desc' })} />
            </Steps>

            {current === 0 && (
                <StepSelect
                    beforeUpload={beforeUpload}
                    handleNextToPreview={handleNextToPreview}
                    handleRemove={handleRemove}
                    file={file}
                    fileMeta={fileMeta}
                    computingHash={computingHash}
                    selectedType={selectedType}
                />
            )}
            {current === 1 && (
                <StepPreview
                    parseError={parseError}
                    summary={summary}
                    previewRows={previewRows}
                    columns={columns}
                    setCurrent={setCurrent}
                />
            )}
            {current === 2 && (
                <StepConfirm
                    summary={summary}
                    form={form}
                    handleConfirmImport={handleConfirmImport}
                    setCurrent={setCurrent}
                />
            )}
        </div>
    );
};

export default DataImport;
