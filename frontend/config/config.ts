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
  routes,
  npmClient: 'yarn',
});
