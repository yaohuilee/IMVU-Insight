import { defineConfig } from '@umijs/max';
import routes from './routes';

export default defineConfig({
  antd: {},
  access: {},
  deadCode: {},
  hash: true,
  model: {},
  initialState: {},
  request: {},
  fastRefresh: true,
  layout: {},
  locale: {
    default: 'en-US',
    baseSeparator: '-',
    antd: true,
    title: true,
    baseNavigator: false,
    useLocalStorage: true,
  },
  routes,
  npmClient: 'yarn',
});
