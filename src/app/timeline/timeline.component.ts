import { Component, OnInit, Input,NgModule } from '@angular/core';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import * as moment from 'moment/moment';
import * as supercluster from 'supercluster';
import {MapComponent} from '../map/map.component';
import {VizLotService} from '../vizLot.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit {

  wait : any;//boucle interval
  tabDates = {};
  tabItems = {};
  tabReperes = {};
  listAnneeSorted = [];
  order: boolean = true;

  nbReperesNonIdentifies : any;
  lastRepereID:any;

  constructor(private _vizLotService : VizLotService) { }

  ngOnInit() {
      this._vizLotService.initTim = () => {this.initTimeline()}

  }
  clicked(){
    //tri des items par chrono

  }
  initTimeline(){

    //création tableau tab dates rangées
    let j = 0;

    for(var i = 0; i < this._vizLotService.tabReperes.length; i++){
      if (!this.tabDates[this._vizLotService.tabReperes[i].properties.ANNEE]){
        this.tabDates[this._vizLotService.tabReperes[i].properties.ANNEE]={
          "id" : this._vizLotService.tabReperes[i].properties.ANNEE,
          "bool" : false,
          "compteurItems" : 0,
          "nbReperes" : 0,
          "items" : [],
          "reperes" : []
        }
        this.listAnneeSorted.push(this._vizLotService.tabReperes[i].properties.ANNEE)
      }
    }
    //tri des annees
    this.listAnneeSorted.sort(this.compareAnneesRecentV2)



    //creation tab item
    for(let i = 0; i < this._vizLotService.tabReperes.length;i++){
      if(!this.tabItems[this._vizLotService.tabReperes[i].properties.DATE]){
        this.tabItems[this._vizLotService.tabReperes[i].properties.DATE] = {
          "compteur" : 0,
          "title" : this._vizLotService.tabReperes[i].properties.ID_REPR,
          "date" : this._vizLotService.tabReperes[i].properties.DATE,
          "displaydate" : moment(this._vizLotService.tabReperes[i].properties.DATE,"DD/MM/YYYY").format("MMM-DD").replace('-',' ').replace('Jan','Janvier').replace('Feb','Février').replace('Mar','Mars').replace('Apr','Avril').replace('May','Mai').replace('Jun','Juin').replace('Jul','Juillet').replace('Aug','Août').replace('Sep','Septembre').replace('Nov','Novembre').replace('Oct','Octobre').replace('Dec','Décembre'),
          "coordinates" : [this._vizLotService.tabReperes[i].geometry.coordinates[0],this._vizLotService.tabReperes[i].geometry.coordinates[1]],
          "annee" : this._vizLotService.tabReperes[i].properties.ANNEE,
          "mois" : this._vizLotService.tabReperes[i].properties.MOIS,
          "jour" : this._vizLotService.tabReperes[i].properties.JOUR,
          "body" : [this._vizLotService.tabReperes[i].geometry.coordinates[0],this._vizLotService.tabReperes[i].geometry.coordinates[1]],
          "boolDisplay" : false,//bool d'affichage
          "reperes" : []
        }

        this.tabDates[this._vizLotService.tabReperes[i].properties.ANNEE].compteurItems++;
        this.tabDates[this._vizLotService.tabReperes[i].properties.ANNEE].items.push(this._vizLotService.tabReperes[i].properties.DATE)
      }
    }


    //creation tabReperes
    let repereID = '';
    for(var i = 0; i < this._vizLotService.tabReperes.length;i++){
      if(this._vizLotService.tabReperes[i].properties.ID_REPR == "unknown"){
        repereID = this._vizLotService.tabReperes[i].properties.ID_REPR+'-'+this._vizLotService.tabReperes[i].properties.DATE+'-'+this._vizLotService.tabReperes[i].properties.HAUTEUR
      }else{
        repereID = this._vizLotService.tabReperes[i].properties.ID_REPR+'-'+this._vizLotService.tabReperes[i].properties.DATE
      }
      this.tabReperes[repereID]={
        "id" : this._vizLotService.tabReperes[i].properties.ID_REPR,
        "idFull" : repereID,
        "date" : this._vizLotService.tabReperes[i].properties.DATE,
        "annee" : this._vizLotService.tabReperes[i].properties.ANNEE,
        "bool" : false,
        "boolDisplayInfo" : false,
        "coordinates" : [this._vizLotService.tabReperes[i].geometry.coordinates[0],this._vizLotService.tabReperes[i].geometry.coordinates[1]],
      }
      this.tabItems[this._vizLotService.tabReperes[i].properties.DATE].compteur++;
      this.tabDates[this._vizLotService.tabReperes[i].properties.ANNEE].nbReperes++;

      this.tabItems[this._vizLotService.tabReperes[i].properties.DATE].reperes.push(repereID);
      this.tabDates[this._vizLotService.tabReperes[i].properties.ANNEE].reperes.push(repereID);

    }//end for
    console.log(Object.keys(this.tabReperes).length)


    //transforme les etiquettes contenant seulement 1 date
    for(let item in this.tabItems){
      if(this.tabItems[item].compteur != 1){
        this.tabItems[item].title = "il y a " +this.tabItems[item].compteur.toString()+" reperes pour cette date"
      }else{
        this.tabItems[item].bool = true
      }
    }

    // console.log('dates',this.tabDates)
    // console.log('items',this.tabItems)
    // console.log('reperes',this.tabReperes)


    //listen behavior object
    this._vizLotService.currentRepere.subscribe(repere => {
      this.displayRepere(repere);
    })

    this._vizLotService.lastRepere.subscribe(repere => {
      this.resetLastRepere(repere);
    })

    //functions attributions
    this._vizLotService.resetBoolForAllYears = () => {this._resetBoolForAllYears();}
    this._vizLotService.resetBoolForAllItems = () => {this._resetBoolForAllItems();}
    this._vizLotService.resetBoolForAllReperes = () => {this._resetBoolForAllReperes();}
    this._vizLotService.resetBoolForEveything = () => {this._resetBoolForEveything();}


  }//fin InitTim


  //METHODS TO EXPORT
  //affichage d'un repere dans la timeline
  displayRepere(repere){
    if(repere.annee){
      this.tabDates[repere.annee].bool = true;
      this.tabItems[repere.date].boolDisplay = true;
      if(repere.id == "unknown"){
        this.tabReperes[repere.id+'-'+repere.date+'-'+repere.hauteur].bool = true;
        this.tabReperes[repere.id+'-'+repere.date+'-'+repere.hauteur].boolDisplayInfo = true;
      }else{
        this.tabReperes[repere.id+'-'+repere.date].bool = true;
        this.tabReperes[repere.id+'-'+repere.date].boolDisplayInfo = true;
      }
      this.wait = setInterval(()=> {
        this.clickButtonScrollTo();
      },50);
    }
  }
  resetLastRepere(repere){
    if(repere.annee){
      this.tabDates[repere.annee].bool = false;
      this.tabItems[repere.date].boolDisplay = false;
      if(repere.id == "unknown"){
        this.tabReperes[repere.id+'-'+repere.date+'-'+repere.hauteur].bool = false;
        this.tabReperes[repere.id+'-'+repere.date+'-'+repere.hauteur].boolDisplayInfo = false;
      }else{
        this.tabReperes[repere.id+'-'+repere.date].bool = false;
        this.tabReperes[repere.id+'-'+repere.date].boolDisplayInfo = false;
      }
    }
  }


  //METHODS INSIDE COMPONENT

  //order of timeline items
  changeOrder(){
    if(this.order){
      this.order= false;
      this.listAnneeSorted.sort(this.compareAnneesRecentV2)
    }
    else{
      this.order = true;
      this.listAnneeSorted.sort(this.compareAnneesOlderV2)
    }
  }
  //comparisons methods
  compareAnneesOlderV2(a,b){
    if (a < b)
      return -1;
    if (a > b)
      return 1;
    return 0;
  }
  compareAnneesRecentV2(a,b){
    if (a > b)
      return -1;
    if (a < b)
      return 1;
    return 0;
  }
  compareDateOlderV2(a,b){
      if (a.mois < b.mois)
        return -1;
      if (a.mois > b.mois)
        return 1;
      if (a.mois == b.mois){
        if (a.jour < b.jour)
          return -1;
        if (a.jour > b.jour)
          return 1;
        return 0;
      }
  }
  compareDateRecentV2(a,b){
      if (a.mois > b.mois)
        return -1;
      if (a.mois < b.mois)
        return 1;
      if (a.mois == b.mois){
        if (a.jour > b.jour)
          return -1;
        if (a.jour < b.jour)
          return 1;
        return 0;
      }
  }
  getArrayItemsSorted(annee){
    if(annee.items.length == 1){
      return annee.items
    }
    let object = [], tab = [];
    annee.items.forEach(itemID => {
      object.push({
        id : itemID,
        mois : this.tabItems[itemID].mois,
        jour : this.tabItems[itemID].jour
      })
    });
    if(this.order){
      object.sort(this.compareDateRecentV2)
    }else{
      object.sort(this.compareDateOlderV2)
    }
    object.forEach(obj => {
      tab.push(obj.id)
    });

    return tab;
  }


  //actions timeline
  collapseAll(){
    for(let dateID in this.tabDates){
      this.tabDates[dateID].bool = false;
    }
    for(let itemID in this.tabItems){
      this.tabItems[itemID].boolDisplay = false;
    }
    //reset layers map
    this._vizLotService.resetMarkersHighlight();
    this.resetZoom();
  }
  dateClick(annee){
    //reset stuffs
    this._vizLotService.removePopUp();
    if(annee.bool){
      annee.bool = false;
      this._resetBoolForAllReperes();
      this._vizLotService.resetMarkersHighlight();
      this._vizLotService.clearTabReperesConcerned();
      this._vizLotService.resetClusterHidden()
    }else{
      annee.bool = true;
      if(annee.compteurItems == 1 && annee.nbReperes== 1){
        this.repereChoisi(this.tabItems[annee.items],this.tabReperes[annee.reperes])
      }else{
        //when open the date
        var date = annee.id;
        this._vizLotService.getReperesConcernedByYear(date);
        //this._vizLotService.setMarkersHighLight()
        //trouver le centre des points
        let tab = [];
        annee.reperes.forEach(repereID => {
            tab.push({
              lng : this.tabReperes[repereID].coordinates[0],
              lat : this.tabReperes[repereID].coordinates[1]
            })
        });
        let center = this._vizLotService.getCenterAndBboxNeSw(tab);
        let bbox = new mapboxgl.LngLatBounds(center.sw,center.ne)
        this._vizLotService.mapFitBounds(bbox,200)
        //store center to use with zoomBack
        this._vizLotService.lastCoordinates = center.center;
      }
    }
  }
  anneesClass(annee){
    if(annee.bool){
      return "";
    }else{
      return "hidden";
    }
  }
  textBottomYearClass(annee){
    if(annee.bool){
      return "hidden";
    }else{
      return "";
    }
  }
  isSeeButton(annee,item){
    if(item.reperes.length > 1){
      if(annee.items.length == 1){
        return false;
      }
      return true;
    }else{
      return false;
    }
  }

  //actions items
  groupeRepereChoisi(item){
    this._vizLotService.resetBoolForAllReperes();
    if(item.boolDisplay == false){
      item.boolDisplay = true;
      //interactions map
      // bound
      let tab = [];
      item.reperes.forEach(repereID => {
        tab.push({lng : this.tabReperes[repereID].coordinates[0],lat : this.tabReperes[repereID].coordinates[1]});
      });
      let center = this._vizLotService.getCenterAndBboxNeSw(tab);
      let bbox = new mapboxgl.LngLatBounds(center.sw,center.ne)
      this._vizLotService.mapFitBounds(bbox,100)
      //get the center used later too zoom back
      this._vizLotService.lastCoordinates = center.center;
      //reset and set
      this._vizLotService.getReperesConcernedByDate(item.date);

    }else{
      this._vizLotService.removePopUp();
      this._vizLotService.resetClusterHidden()
      item.boolDisplay = false;
      var date = item.date;
      //remettre les status2 à "normal"
      this._vizLotService.resetMarkersHighlight();
      this._vizLotService.clearTabReperesConcerned();
    }
  }
  itemsClass(annee,item){
    let string;
    if(item.boolDisplay){
      string = '';
    }else if (item.reperes.length == 1){
      item.boolDisplay = true;
      string = '';
    }else if (annee.items.length == 1){
      item.boolDisplay = true;
      string = '';
    }else{
      string = 'hidden';
    }
    string += ' row'
    return string;
  }
  isBtnZoomBack(item){
    if(this._vizLotService.lastCoordinates){
      return true
    }else{
      return false;
    }
  }
  goBackButtonZoom(){
    if(this._vizLotService.lastCoordinates){
      this._vizLotService.mapFlyTo(10.5,this._vizLotService.lastCoordinates)
    }
  }
  isStringItem(annee,item){
    if (item.reperes.length == 1) {
      if(annee.items.length == 1){
        return true;
      }
      return false;
    }else{
      return true;
    }
  }

  //actions reperes
  isRepereCorrect(repere){
    return repere.id != "unknown";
  }
  getNbReperesNonIdentifies(item){
    let nb = 0;
    for(let repereID in this.tabReperes){
      if(this.tabReperes[repereID].date == item.date && this.tabReperes[repereID].id == "unknown"){
        nb++;
      }
    }
    return nb;
  }
  repereChoisi(item,repere){
    if(repere.bool){
      repere.boolDisplayInfo = false;
      repere.bool = false;
      this._vizLotService.resetMarkersHighlight();
      this._vizLotService.removePopUp();
    }else{
      //reset Bool of the repere in timeline
      this._vizLotService.resetBoolForAllReperes();
      //bools of the repere
      repere.boolDisplayInfo = true;
      repere.bool = true;
      //store center to zoomback later
      this._vizLotService.lastCoordinates = repere.coordinates;
      this._vizLotService.mapFlyTo(14,repere.coordinates)
      //reset Statut to highlight on map
      //this._vizLotService.getReperesConcernedByDate(repere.date);
      //THE point choosen
      this._vizLotService.getReperesConcernedByDateAndId(repere.date,repere.id);
      //pop up
      this._vizLotService.addPopUp(repere.coordinates,repere.id + " " + repere.date);

    }
  }
  repereButtonClass(repere){
    let string;
    if(repere.bool){
      string = 'btn-danger';
    }else{
      string = 'btn-primary';
    }
    if(repere.boolDisplayInfo){
      string += ' col-md-12'
    }else{
      string += ' col-md-6'
    }
    string += ' btn'
    return string;
  }
  //text inside
  isDisplayRepereContent(repere){
    return repere.boolDisplayInfo;
  }
  textRepereClass(repere){
    let string;
    string = 'col-md-12'
    return string
  }

  //general actions
  resetZoom(){
    this._vizLotService.mapFlyTo(7.5,[2.03230823666658,44.57358258301829])
  }
  topTimeline(){
    document.getElementById('top').scrollIntoView();
  }

  clickButtonScrollTo(){
    clearInterval(this.wait);
    if(document.getElementById(this._vizLotService.currentRepere.value.id+'-'+this._vizLotService.currentRepere.value.date)){
      var el = document.getElementById(this._vizLotService.currentRepere.value.id+'-'+this._vizLotService.currentRepere.value.date);
      el.scrollIntoView(false);
    }else if(this._vizLotService.currentRepere.value.id == "unknown"){
      var el = document.getElementById(this._vizLotService.currentRepere.value.date);
      el.scrollIntoView();
    }
  }
  //multi buttons when multi point selected
  btnTabMultiPointSelected(point){
    this._vizLotService.resetBoolForEveything();
    this._vizLotService.currentRepere.next({
      date : point.date,
      annee : point.annee,
      id : point.id,
      coords : point.coords
    })
    if(this._vizLotService.currentRepere.value.date == false){
      alert('Désolé ce repère n\'a pas de date ! ');
      throw ('Date missing')
    }
    this._vizLotService.lastCoordinates = this._vizLotService.currentRepere.value.coords;
    this._vizLotService.addPopUp(this._vizLotService.currentRepere.value.coords,this._vizLotService.currentRepere.value.id+" "+this._vizLotService.currentRepere.value.date);

    //highlight all the points which have the same date as the point clicked
    this._vizLotService.getReperesConcernedByDate(this._vizLotService.currentRepere.value.date);

    //highlight the point clicked
    this._vizLotService.getReperesConcernedByDateAndId(this._vizLotService.currentRepere.value.date,this._vizLotService.currentRepere.value.id);
    //clear tab
    this._vizLotService.tabMultiPointSelected = [];
  }
  getKeysObject(obj){
    return Object.keys(obj)
  }
  getReperesKeysOfItem(item){
    let tab =[];
    for(let repereID in this.tabReperes){
      if(this.tabReperes[repereID].date == item.date){
        tab.push(repereID)
      }
    }
    return tab;
  }



  _resetBoolForAllYears(){
    for(let dateID in this.tabDates){
      this.tabDates[dateID].bool = false;
    }
  }
  _resetBoolForAllItems(){
    for(let itemID in this.tabItems){
      this.tabItems[itemID].boolDisplay = false;
    }
  }
  _resetBoolForAllReperes(){
    for(let repereID in this.tabReperes){
      this.tabReperes[repereID].bool = false;
      this.tabReperes[repereID].boolDisplayInfo = false;
    }
  }
  _resetBoolForEveything(){
    this._resetBoolForAllYears()
    this._resetBoolForAllItems()
    this._resetBoolForAllReperes()
  }
}
