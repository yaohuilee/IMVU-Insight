export default [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    name: 'Dashboard',
    icon: 'DashboardOutlined',
    path: '/dashboard',
    component: './Dashboard',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
