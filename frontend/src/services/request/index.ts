import { requestConfig } from './config';
import { authConfig } from './auth';
import { errorConfig } from './error';

export const request = {
    ...requestConfig,
    ...authConfig,
    ...errorConfig,
};