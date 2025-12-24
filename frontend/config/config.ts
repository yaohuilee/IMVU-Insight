import { defineConfig } from '@umijs/max';
import routes from './routes';
import proxy from './proxy';

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
  plugins: ['@umijs/max-plugin-openapi'],
  proxy,
  openAPI: {
    requestLibPath: "import { request } from '@umijs/max'",
    schemaPath: 'http://127.0.0.1:7000/openapi.json',
    projectName: 'insight',
    namespace: 'INSIGHT_API',
    apiPrefix: "'/insight/api'",
    mock: false,
  },
});
