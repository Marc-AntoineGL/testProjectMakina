import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import * as polylabel from 'polylabel'


@Injectable()
export class VizLotService {

  //tab with all wanted geojson features
  tabReperes : any[];

  //geojson objects
  geojsons : any = {};

  //dictionaries
  dictionaries : any = {};

  //future general functions
  initMap : any;
  initTim : any;
  editSomeData : any;

  // store last repere coords
  lastCoordinates: any;
  //store repere if multi selected
  tabMultiPointSelected: any;

  currentRepere: BehaviorSubject<any> = new BehaviorSubject({});
  lastRepere: BehaviorSubject<any> = new BehaviorSubject({});

  //future attribution map functions
  resetMarkersHighlight : any;
  setMarkersHighLight:any;
  addPopUp:any;
  removePopUp:any;
  getReperesConcernedByDateAndId:any;
  getReperesConcernedByYear:any;
  getReperesConcernedById:any;
  getReperesConcernedByDate:any;
  clearTabReperesConcerned:any;
  mapFitBounds:any;
  mapFlyTo:any;
  getCenterAndBboxNeSw:any;
  resetClusterHidden:any;

  //future attribution timeline functions
  resetBoolForAllYears:any;
  resetBoolForAllItems:any;
  resetBoolForAllReperes:any;
  resetBoolForEveything:any;



  constructor(private http:Http) {

  }
  loadData(){

    //faire des promesses, suscribe => as Promise, recup dans un tab et then.all()
      this.http.get('assets/pointsV2.geojson').map((res : any) => res.json()).subscribe((repere) =>{
      this.http.get('assets/limittes_ss_bassins.geojson').map((res : any) => res.json()).subscribe(lim =>{
      this.http.get('assets/communes_papi.geojson').map((res : any) => res.json()).subscribe(communes =>{
        this.geojsons.limites = lim;
        this.geojsons.reperes = repere;
        this.geojsons.communes = communes;
        this.editSomeData();
        this.initMap();
        this.initTim();
      });
      });
      });
   }
  //get correct center
  getCenter(geometry){
    var p = polylabel(geometry)
    return p
  }





  //Getters Setters


}
