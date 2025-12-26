export default [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    layout: false,
    component: './login',
  },
  {
    name: 'dashboard',
    icon: 'DashboardOutlined',
    path: '/dashboard',
    component: './dashboard',
  },
  {
    name: 'dataManagement',
    locale: 'menu.dataManagement',
    icon: 'DatabaseOutlined',
    path: '/data-management',
    routes: [
      {
        name: 'dataManagement.dataSync',
        locale: 'menu.dataManagement.dataSync',
        path: '/data-management/data-sync',
        component: './data-management/data-sync',
      },
      {
        name: 'dataManagement.snapshots',
        locale: 'menu.dataManagement.snapshots',
        path: '/data-management/snapshots',
        component: './404',
      },
      {
        name: 'dataManagement.dataQuality',
        locale: 'menu.dataManagement.dataQuality',
        path: '/data-management/data-quality',
        component: './404',
      },
    ],
  },
  {
    name: 'businessAnalysis',
    locale: 'menu.businessAnalysis',
    icon: 'BarChartOutlined',
    path: '/business-analysis',
    routes: [
      {
        name: 'businessAnalysis.customers.buyers',
        locale: 'menu.businessAnalysis.customers.buyers',
        path: '/business-analysis/customers/buyers',
        component: './business-analysis/customers/buyers',
      },
      {
        name: 'businessAnalysis.customers.buyers.detail',
        locale: 'menu.businessAnalysis.customers.buyers.detail',
        path: '/business-analysis/customers/buyers/:id',
        component: './business-analysis/customers/buyers/detail',
        hideInMenu: true,
      },
      {
        name: 'businessAnalysis.customers.recipients',
        locale: 'menu.businessAnalysis.customers.recipients',
        path: '/business-analysis/customers/recipients',
        component: './business-analysis/customers/recipients',
      },
      {
        name: 'businessAnalysis.customers.recipients.detail',
        locale: 'menu.businessAnalysis.customers.recipients.detail',
        path: '/business-analysis/customers/recipients/:id',
        component: './business-analysis/customers/recipients/detail',
        hideInMenu: true,
      },
      {
        name: 'businessAnalysis.products',
        locale: 'menu.businessAnalysis.products',
        path: '/business-analysis/products',
        component: './business-analysis/products',
      },
        {
          name: 'businessAnalysis.products.detail',
          locale: 'menu.businessAnalysis.products.detail',
          path: '/business-analysis/products/:id',
          component: './business-analysis/products/detail',
          hideInMenu: true,
        },
      {
        name: 'businessAnalysis.sales',
        locale: 'menu.businessAnalysis.sales',
        path: '/business-analysis/sales',
        component: './business-analysis/sales',
      },
    ],
  },
  {
    name: 'imvuGraph',
    locale: 'menu.imvuGraph',
    icon: 'ClusterOutlined',
    path: '/imvu-graph',
    routes: [
      {
        name: 'imvuGraph.users',
        locale: 'menu.imvuGraph.users',
        icon: 'TeamOutlined',
        path: '/imvu-graph/users',
        component: './imvu-graph/users',
      },
        {
          name: 'imvuGraph.users.detail',
          locale: 'menu.imvuGraph.users.detail',
          path: '/imvu-graph/users/:id',
          component: './imvu-graph/users/detail',
          hideInMenu: true,
        },
      {
        name: 'imvuGraph.relations',
        locale: 'menu.imvuGraph.relations',
        icon: 'ShareAltOutlined',
        path: '/imvu-graph/relations',
        component: './imvu-graph/relations',
      },
      {
        name: 'imvuGraph.entityExplorer',
        locale: 'menu.imvuGraph.entityExplorer',
        icon: 'ApartmentOutlined',
        path: '/imvu-graph/entity-explorer',
        component: './imvu-graph/entity-explorer',
      },
    ]
  },
  {
    name: 'system',
    locale: 'menu.system',
    icon: 'SettingOutlined',
    path: '/system',
    routes: [
      {
        name: 'system.about',
        locale: 'menu.system.about',
        path: '/system/about',
        component: './system/about',
      },
      {
        name: 'system.developers',
        locale: 'menu.system.developers',
        path: '/system/developers',
        component: './system/developers',
      },
      {
        name: 'system.settings',
        locale: 'menu.system.settings',
        path: '/system/settings',
        component: './system/settings',
      },
    ],
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
