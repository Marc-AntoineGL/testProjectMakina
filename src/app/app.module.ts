import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import 'mapbox-gl/dist/mapbox-gl';
import { Routes, RouterModule } from '@angular/router';
import * as moment from 'moment';
import * as supercluster from 'supercluster';
import {VizLotService} from './vizLot.service';
import { AlertModule } from 'ngx-bootstrap';
import { AccordionModule } from 'ngx-bootstrap/accordion';

import { AppComponent } from './app.component';
import { MapTimelineComponent } from './map-timeline/map-timeline.component';
import { HomeComponent } from './home/home.component';
import { MapComponent } from './map/map.component';
import { TimelineComponent } from './timeline/timeline.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'map-timeline', component: MapTimelineComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    MapTimelineComponent,
    HomeComponent,
    MapComponent,
    TimelineComponent
  ],
  imports: [
    BrowserModule,
    AlertModule.forRoot(),
    AccordionModule.forRoot(),
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes),
  ],
  providers: [VizLotService],
  bootstrap: [AppComponent]
})
export class AppModule { }
