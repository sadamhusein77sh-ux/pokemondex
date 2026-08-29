import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'browse',
        loadChildren: () =>
          import('../features/browse/browse.module').then((m) => m.BrowsePageModule),
      },
      {
        path: 'favorites',
        loadChildren: () =>
          import('../features/favorites/favorites.module').then(
            (m) => m.FavoritesPageModule,
          ),
      },
      {
        path: 'team',
        loadChildren: () =>
          import('../features/team/team.module').then((m) => m.TeamPageModule),
      },
      {
        path: 'about',
        loadChildren: () =>
          import('../features/about/about.module').then((m) => m.AboutPageModule),
      },
      {
        path: '',
        redirectTo: '/tabs/browse',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/browse',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
