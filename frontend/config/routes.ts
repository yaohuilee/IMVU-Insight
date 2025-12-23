export default [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    layout: false,
    component: './Login',
  },
  {
    name: 'dashboard',
    icon: 'DashboardOutlined',
    path: '/dashboard',
    component: './Dashboard',
  },
  {
    name: 'dataSync',
    icon: 'CloudUploadOutlined',
    path: '/data-sync',
    component: './DataSync',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
