import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import {
  ActionSheetController,
  AlertController,
  IonicModule,
  IonicRouteStrategy,
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular/lazy';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, CoreModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(),
    ModalController,
    ToastController,
    AlertController,
    ActionSheetController,
    LoadingController,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}