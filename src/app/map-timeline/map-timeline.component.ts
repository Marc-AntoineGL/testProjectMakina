import { Component, OnInit, Input, Output } from '@angular/core';
import * as moment from 'moment/moment';
import {TimelineComponent} from '../timeline/timeline.component'
import {MapComponent} from '../map/map.component'
import {VizLotService} from '../vizLot.service';


@Component({
  selector: 'app-map-timeline',
  templateUrl: './map-timeline.component.html',
  styleUrls: ['./map-timeline.component.css']
})
export class MapTimelineComponent implements OnInit {


  constructor(private _vizLotService : VizLotService) {

  }

  ngOnInit() {
    this._vizLotService.editSomeData = () => {this._editSomeData();}
    this._vizLotService.loadData();

  }

  _editSomeData(){
    this._vizLotService.tabReperes = [];
    //créer le tableau contenant seulement les reperes ayant id_repr et date
    for (var i = 0; i < this._vizLotService.geojsons.reperes.features.length; i++){
        if(this._vizLotService.geojsons.reperes.features[i].properties.DATE != null){
          //formatage DATE car différents formats dans le geojson
          this._vizLotService.geojsons.reperes.features[i].properties.DATE = moment(this._vizLotService.geojsons.reperes.features[i].properties.DATE,"DD/MM/YYYY").format("DD/MM/YYYY");
          this._vizLotService.geojsons.reperes.features[i].properties.ANNEE= moment(this._vizLotService.geojsons.reperes.features[i].properties.DATE,"DD/MM/YYYY").format("YYYY");
          this._vizLotService.geojsons.reperes.features[i].properties.MOIS= moment(this._vizLotService.geojsons.reperes.features[i].properties.DATE,"DD/MM/YYYY").format("MM");
          this._vizLotService.geojsons.reperes.features[i].properties.JOUR= moment(this._vizLotService.geojsons.reperes.features[i].properties.DATE,"DD/MM/YYYY").format("DD");
          if (this._vizLotService.geojsons.reperes.features[i].properties.ID_REPR != null){ //si le feature a un id this._vizLotService.geojsons.reperes et une date
            this._vizLotService.tabReperes.push(this._vizLotService.geojsons.reperes.features[i]);
          }else{
            //replace when no ID_REPR
            this._vizLotService.geojsons.reperes.features[i].properties.ID_REPR = "unknown";
            this._vizLotService.tabReperes.push(this._vizLotService.geojsons.reperes.features[i]);//non ajout repere unknown
          }// end if
        }else{
          //replace when no DATE
          this._vizLotService.geojsons.reperes.features[i].properties.DATE = false;
        }
      }//end for

    //repere dictionary for map reperes
    this._vizLotService.dictionaries.reperes = {}
    this._vizLotService.tabReperes.forEach(rep => {
      this._vizLotService.dictionaries.reperes[rep.properties.DATE+'-'+rep.properties.ID_REPR] = rep;
    });

    //limites dico with reperes content dictionary
    this._vizLotService.dictionaries.limitesSSB = {}
    this._vizLotService.geojsons.reperes.features.forEach(rep => {
      if(this._vizLotService.dictionaries.limitesSSB[rep.properties.LIBELLE]){
        this._vizLotService.dictionaries.limitesSSB[rep.properties.LIBELLE].reperes.push(rep);
      }else{
        this._vizLotService.dictionaries.limitesSSB[rep.properties.LIBELLE] = {};
        this._vizLotService.dictionaries.limitesSSB[rep.properties.LIBELLE].reperes = [];
        this._vizLotService.dictionaries.limitesSSB[rep.properties.LIBELLE].reperes.push(rep);
      }
    });

    //communes dictionary
    this._vizLotService.dictionaries.communes = {};
    this._vizLotService.geojsons.communes.features.forEach(e => {
      this._vizLotService.dictionaries.communes[e.properties.COD_INSEE] = e;
    });

    //communes concerned by reperes dictionary
    this._vizLotService.dictionaries.communesContainReperes = {}
    this._vizLotService.geojsons.reperes.features.forEach(rep => {
      if(this._vizLotService.dictionaries.communesContainReperes[rep.properties.COD_INSEE]){
        this._vizLotService.dictionaries.communesContainReperes[rep.properties.COD_INSEE].reperes.push(rep);
      }else{
        this._vizLotService.dictionaries.communesContainReperes[rep.properties.COD_INSEE] = {};
        this._vizLotService.dictionaries.communesContainReperes[rep.properties.COD_INSEE].commune = this._vizLotService.dictionaries.communes[rep.properties.COD_INSEE]
        this._vizLotService.dictionaries.communesContainReperes[rep.properties.COD_INSEE].reperes = [];
        this._vizLotService.dictionaries.communesContainReperes[rep.properties.COD_INSEE].reperes.push(rep);
      }
    });

  }//end _upData

}
