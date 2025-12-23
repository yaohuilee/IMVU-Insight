export type HistoryItem = {
    key: string;
    importTime: string;
    type: string;
    fileName: string;
    records: string;
    status: 'Success' | 'Partial Failure' | 'Failure';
};
