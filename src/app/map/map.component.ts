import { Component, OnInit, Input, Output } from '@angular/core';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import { Http, Response } from '@angular/http';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import * as moment from 'moment/moment';
import * as supercluster from 'supercluster'
import * as polylabel from 'polylabel'
import {TimelineComponent} from '../timeline/timeline.component'
import {VizLotService} from '../vizLot.service';

declare var MapboxglSpiderfier: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})


export class MapComponent implements OnInit {

  lastCommune : any = 0;
  map:any;
  markers:any={}
  allClusters = {};
  modeClusteringCommunes : string = 'tight'
  lastZoomLevel :any;
  pop : any;
  tabPopUp = []
  testSpiderfer : any;
  tabReperesConcerned = [];
  idsLastClusterDeleted:any ={}
  //dictionaries
  dicoSsbClusters:any = {};
  dicoAloneReperes: any = {};
  dicoClusterCommune: any = {};
  dicoLeaves : any = {};
  dicoAloneReperesSup: any = {};

  constructor(private http:Http, private _vizLotService : VizLotService) { }

  ngOnInit() {


    this._vizLotService.initMap = () => {this._initMap();}

  }
  ngAfterViewInit(){

  }

  _initMap(){
    //CREATION Map
    mapboxgl.accessToken = "pk.eyJ1IjoibWFyY3N0YWdpYWlyZSIsImEiOiJjajFkamp1Y3kwMDB6MnFuMmVwcTNsMXU1In0.L1qp6GMQgpRI1PszznjFKQ";
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v9",
      zoom: 7.5,
      maxzoom : 13,
      center: [2.03230823666658,44.57358258301829]
      //point Lot 2.03230823666658,44.57358258301829
      // point test: 3.592754332115504,46.25304803541718
    });
    // Add zoom and rotation controls to the map.

    //map's controls
    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on("load", ()  => {

      this._vizLotService.geojsons.dynamicGeojson = {
        "type": "FeatureCollection",
        "features": []
      };

      //SOURCES
      //source des REPERES
      this.map.addSource("repereSource",{
        "type" : "geojson",
        "data" : this._vizLotService.geojsons.reperes,
      });
      //source limits sous BASSINS
      this.map.addSource("limites_ss_b",{
        "type" : "geojson",
        "data" : this._vizLotService.geojsons.limites
      });
      //source limits communes PAPI
      this.map.addSource("communes_papi",{
        "type" : "geojson",
        "data" : this._vizLotService.geojsons.communes
      });
      //first empty and then fill with concerned commune
      this.map.addSource("fillCommunes_papi",{
        "type" : "geojson",
        "data" : this._vizLotService.geojsons.dynamicGeojson
      });

      //COUCHES

      //Couche communes PAPI
      //contour
      this.map.addLayer({
        id : "limCommunesLayer",
        type : "line",
        source : "communes_papi",
        minzoom : 9,
        filter : ['any',
          ["==","NOM_DEPT","LOT ET GARONNE"],
          ["==","NOM_DEPT","LOT"]
        ],
        paint :
          {
            'line-color': {
              property : 'NOM_DEPT',
              type : 'categorical',
              stops : [
                // ['AVEYRON','red'],
                // ['CANTAL','yellow'],
                // ['DORDOGNE','green'],
                // ['HAUTE LOIRE','orange'],
                ['LOT','blue'],
                ['LOT ET GARONNE','purple'],
                // ['LOZERE','pink'],
                // ['TARN ET GARONNE','grey'],
              ]
            },
            'line-opacity': 0.9,
            'line-width': 1
          }
      });
      // couche écoute mousemove
      this.map.addLayer({
        id : "fillCommunesLayer",
        type : "fill",
        source : "communes_papi",
        filter : ['any',
          ["==","NOM_DEPT","LOT ET GARONNE"],
          ["==","NOM_DEPT","LOT"]
        ],
        maxzoom : 12,
        minzoom : 10,
        paint :
          {
            'fill-color': 'white',
            'fill-opacity': 0.0
          }
      });
      //remplissage
      this.map.addLayer({
        id : "fillMouseOverCommunesLayer",
        type : "fill",
        source : "fillCommunes_papi",
        filter : ['any',
          ["==","NOM_DEPT","LOT ET GARONNE"],
          ["==","NOM_DEPT","LOT"]
        ],
        maxzoom : 12,
        minzoom : 10,
        paint :
          {
            'fill-color': {
              property : 'NOM_DEPT',
              type : 'categorical',
              stops : [
                // ['AVEYRON','red'],
                // ['CANTAL','yellow'],
                // ['DORDOGNE','green'],
                // ['HAUTE LOIRE','orange'],
                ['LOT','blue'],
                ['LOT ET GARONNE','purple'],
                // ['LOZERE','pink'],
                // ['TARN ET GARONNE','grey'],
              ]
            },
            'fill-opacity': 0.5
          }
      });

      //COUCHE LIMITES SOUS BASSINS
      // contour
      this.map.addLayer({
        id : "limitesSSBLayer",
        type : "line",
        source : "limites_ss_b",
        filter : ["==","$type","Polygon"],
        paint :
          {
            'line-color': 'black',
            'line-opacity': 0.9,
            'line-width': 2
          }
      });
      // couche ecoute mousemove
      this.map.addLayer({
        id : "fillSsbLayer",
        type : "fill",
        source : "limites_ss_b",
        maxzoom : 9,
        filter : ["==","$type","Polygon"],
        paint :
          {
            'fill-color': 'grey',
            'fill-opacity': 0.0
          }
      });
      //remplissage gris
      this.map.addLayer({
        id : "fillSsbLayerMouseOver",
        type : "fill",
        source : "limites_ss_b",
        filter : [
          "all",
          ["==","$type","Polygon"],
          ["==", "LIBELLE", "blabla"]
        ],
        maxzoom : 9,
        paint :
          {
            'fill-color': 'grey',
            'fill-opacity': 0.5
          }
      });

      //Couches concernant les repères
      //points
      this.map.addLayer({
        id : "reperesLayer",
        type : "circle",
        source : "repereSource",
        minzoom : 9,
        // filter : ['all',
        //   ['!=','STATUS2','hidden']
        // ],
        paint :{
            "circle-radius" : {
              'stops':[[14,10],[16,15],[20,25]]
            },
            'circle-color' : 'transparent',
            "circle-stroke-color" : 'transparent',
            "circle-stroke-width" : 1
        },
        // layout : {
        //   visibility : 'none'
        // }

      });

      //EVENT MOUSE MOVE
      //Mouse on lim departments
      this.map.on("mousemove", "fillSsbLayer", (e) => {
        this.map.setFilter("fillSsbLayerMouseOver", [
          "all",
          ["==","$type","Polygon"],
          ["==", "LIBELLE", e.features[0].properties.LIBELLE]
        ]);
      });
      this.map.on("mouseleave", "fillSsbLayer", () => {
        this.map.setFilter("fillSsbLayerMouseOver", [
          "all",
          ["==","$type","Polygon"],
          ["==", "LIBELLE","blabla"]
        ]);
      });
      //Mouse on lim communes
      this.map.on("mousemove", "fillCommunesLayer", (e) => {
        if(this.lastCommune != e.features[0].properties.COD_INSEE){
          this._vizLotService.geojsons.dynamicGeojson.features = [];
          this._vizLotService.geojsons.dynamicGeojson.features.push(this._vizLotService.dictionaries.communes[e.features[0].properties.COD_INSEE])
          this.map.getSource('fillCommunes_papi').setData(this._vizLotService.geojsons.dynamicGeojson)
          this.lastCommune = e.features[0].properties.COD_INSEE;
        }
      });
      this.map.on("mouseleave", "fillCommunesLayer", () => {
        this._vizLotService.geojsons.dynamicGeojson.features = [];
        this.map.getSource('fillCommunes_papi').setData(this._vizLotService.geojsons.dynamicGeojson)
      });


      //init and set clusters on the map
      this.createSsbClusters()
      this.createCommunesClusters()
      this.getSsbClusters(Math.round(this.map.getZoom()));
      setTimeout(()=> {
        this.setSsbClustersOnMap();
      },50);

      //init a spiderfier //testin for the moment
      this.testSpiderfer = new MapboxglSpiderfier(this.map,{
        onClick: function(e, options){
        console.log(options.marker);
        },
        markerWidth: 40,
        markerHeight: 40
      })


    }); //end "load"

    //EVENT MAP ON CLICK

    this.map.on("click", (e) => {
      //console.log(e)
      //console.log(this.map.queryRenderedFeatures(e.point))
      //this.testSpiderfer.unspiderfy()
      //console.log([e.lngLat.lng,e.lngLat.lat])
      //console.log(this.map.getBounds());
      // console.log(this.map.getZoom())
      //this.map.fitBounds([[0.07852869661471118, 43.37445229907917],[ 3.986087776722286 ,45.7484877214126]])
      //fitBounds([ws,en])
    });

    this.map.on('mousemove',(e) =>{
      let bool = false;
      this.map.queryRenderedFeatures(e.point).forEach(feature => {
        if(feature.layer.id == "reperesLayer")
        bool = true;
      });
      if(bool){
        this.map.getCanvas().style.cursor = 'grab'
      }else{
        this.map.getCanvas().style.cursor = 'default'
      }
    })
    this.map.on("click","reperesLayer",(e) => {
      var all = this.map.queryRenderedFeatures(e.point, {layers : ["reperesLayer"]}),boolPoint;
      console.log(this.map.queryRenderedFeatures(e.point, {layers : ["reperesLayer"]}))
      boolPoint = false;
      let result = []
      all.forEach(point => {
        if(document.getElementById(point.properties.DATE+'-'+point.properties.ID_REPR)||
      document.getElementById(point.properties.DATE+'-'+point.properties.ID_REPR+'-'+point.properties.HAUTEUR)){
        result.push(point)
      }
      });
      if(all.length == 0){
        throw ('div repere not displayed yet');
      }

      if(result.length > 1){
        this._vizLotService.tabMultiPointSelected = [];
        this._vizLotService.resetBoolForEveything();
        this.pop = new mapboxgl.Popup({closeOnClick: true});

        let html ='<h2>Choisir un repère ! </h2>'
        this.pop.setLngLat(result[0].geometry.coordinates)
        .setHTML(html)
        .addTo(this.map);
        result.forEach(point => {
          this._vizLotService.tabMultiPointSelected.push({
            "id" : point.properties.ID_REPR,
            "date" : point.properties.DATE,
            "annee" : point.properties.ANNEE,
            "coords" : point.geometry.coordinates
          })
        });
        //if no point selected for 5 sec
        setTimeout(()=>{ this._vizLotService.tabMultiPointSelected = []; } ,5000)


      }else{
        if(result.find((point)=>{
          return point.properties.DATE == false ;
        })){
          throw ('Some Data missing !')
        }

        //reset opened features in timeline
        if(this._vizLotService.currentRepere.value.id !=null && this._vizLotService.currentRepere.value.date !=null && this._vizLotService.currentRepere.value.annee !=null){
          this._vizLotService.lastRepere.next(this._vizLotService.currentRepere.value);
        }

        // get the new element clicked on the layer
        //var result = this.map.queryRenderedFeatures(e.point, {layers : ["reperesLayer"]});
        //update currentRepere
        this._vizLotService.currentRepere.next({
          date :result[0].properties.DATE,
          annee : result[0].properties.ANNEE,
          hauteur : result[0].properties.HAUTEUR,
          id : result[0].properties.ID_REPR,
          coords : result[0].geometry.coordinates
        })
        this._vizLotService.lastCoordinates = this._vizLotService.currentRepere.value.coords;
        this._vizLotService.addPopUp(this._vizLotService.currentRepere.value.coords,this._vizLotService.currentRepere.value.id+" "+this._vizLotService.currentRepere.value.date);

      }

    }); //fin de on 'click' 'reperesLayer'

    this.map.on("click","fillSsbLayer",(e) =>{
      var result = this.map.queryRenderedFeatures(e.point, {layers : ["fillSsbLayer"]});
      var content = result[0].properties.LIBELLE;
      if (this.map.getZoom() < 9){ //
        //create fake tab to have dep's center of river
        let tabDep = [
          { name : "Lot Aval", center : [0.7515100473515872, 44.403379430982596]},
          { name : "Lot Moyen 46", center : [1.3470360198941762, 44.51406150818673]},
          { name : "Cele", center : [1.8743797698865592, 44.60995037678822]},
          { name : "Lot Moyen 12", center : [2.220449105819057, 44.506226868213076]},
          { name : "Truyere", center : [2.9537865081717882, 44.85968990195286]},
          { name : "Lot Amont", center : [3.233937875355224, 44.527769593996766]},
        ];
        //fly and pop up
        tabDep.find((dep) => {
          this.map.flyTo({
            zoom : 10,
            center : dep.center
          })
          if(dep.name == "Lot Aval"){
            this._vizLotService.addPopUp([0.7515100473515872, 44.403379430982596],content);
          }else{
            this._vizLotService.addPopUp(dep.center,content);
          }
          return dep.name == result[0].properties.LIBELLE
        })
      } // end if
    }); // fin du map.on 'click', 'fillSsbLayer'

    this.map.on("click","fillCommunesLayer",(e) =>{

      //for show/hide points
      // this.map.setFilter("reperesLayer", [
      //   "all",
      //   ["==","$type","Point"],
      //   ["==", "COD_INSEE", e.features[0].properties.COD_INSEE]
      // ]);
      var result = this.map.queryRenderedFeatures(e.point, {layers : ["fillCommunesLayer"]});
      var content = result[0].properties.NOM_DEPT;

      let tab = [];

      result[0].geometry.coordinates[0].forEach(e => {
        tab.push({lng : e[0], lat : e[1]})
      });

      this.map.flyTo({
        zoom : 12,
        center : this._getCenterAndBboxNeSw(tab).center
      })


    }); // fin du map.on 'click', 'fillSsbLayer'

    this.map.on('zoomend', () => {
      let zoomLevel = Math.round(this.map.getZoom())
      this.resetAlonesReperesSup()
      this.idsLastClusterDeleted = ''
      if(this.modeClusteringCommunes == 'tight' && zoomLevel > 10){
        this.modeClusteringCommunes = 'untight'
        this.createCommunesClusters()
      }else if (this.modeClusteringCommunes == 'untight' && zoomLevel <= 10){
        this.modeClusteringCommunes = 'tight'
        this.createCommunesClusters()
      }
      this.markers={}
      if(this.map.getLayer('limCommunesLayer').minzoom >= this.map.getZoom()){
        this.resetMarkers()
        this.getSsbClusters(zoomLevel);
        setTimeout(()=> {
          this.setSsbClustersOnMap();
        },50);
      }else{
        this.resetMarkers()
        this.getCommunesClusters(zoomLevel);
        setTimeout(()=> {
          //set markers on the map
          this.setAloneReperesOnMap();
          this.setClusterCommuneOnMap();
          //highlights
          if(this.tabReperesConcerned.length > 0)
          this._setMarkersHighLight();
        },50);
      }
      this.lastZoomLevel = zoomLevel
    })

    //functions attributions
    this._vizLotService.resetMarkersHighlight = () => {this._resetMarkersHighlight();}
    this._vizLotService.setMarkersHighLight = () => {this._setMarkersHighLight();}
    this._vizLotService.addPopUp = (coords,content) =>{this._addPopUp(coords,content);}
    this._vizLotService.removePopUp = () =>{this._removePopUp();}
    this._vizLotService.getReperesConcernedByDateAndId = (date,id) => {this._getReperesConcernedByDateAndId(date,id);}
    this._vizLotService.getReperesConcernedByYear = (year) => {this._getReperesConcernedByYear(year);}
    this._vizLotService.getReperesConcernedById = (id) => {this._getReperesConcernedById(id);}
    this._vizLotService.getReperesConcernedByDate = (date) => {this._getReperesConcernedByDate(date);}
    this._vizLotService.clearTabReperesConcerned = () =>{this._clearTabReperesConcerned();}
    this._vizLotService.mapFlyTo = (zoom,center) => {this._mapFlyTo(zoom,center);}
    this._vizLotService.mapFitBounds = (bbox,borderSize) => {this._mapFitBounds(bbox,borderSize);}
    this._vizLotService.getCenterAndBboxNeSw = (tab) => {return this._getCenterAndBboxNeSw(tab);}

    this._vizLotService.resetClusterHidden = () => {return this._resetClusterHidden();}
  }

  //relative to superclusters of ssb
  createSsbClusters(){
    this.dicoSsbClusters= {};
    this._vizLotService.geojsons.limites.features.forEach(ssb => {
      let ssbLibelle = ssb.properties.LIBELLE
      if(this._vizLotService.dictionaries.limitesSSB[ssbLibelle]){
        this.allClusters[ssbLibelle] = {};
        let ssbConcerned = this.allClusters[ssbLibelle]
        ssbConcerned.allCommunes = {};
        ssbConcerned.supercluster = supercluster({
             extent: 6666,
             log: false,
             maxZoom: 16,
             radius: 2000,
         });
        ssbConcerned.supercluster.load(this._vizLotService.dictionaries.limitesSSB[ssbLibelle].reperes);
      }
    });
  }
  getSsbClusters(zoomLevel){
    this.dicoSsbClusters= {};
    this._vizLotService.geojsons.limites.features.forEach(ssb => {
      let ssbLibelle = ssb.properties.LIBELLE
      if(this._vizLotService.dictionaries.limitesSSB[ssbLibelle]){
        // this.allClusters[ssbLibelle] = {};
        let ssbConcerned = this.allClusters[ssbLibelle]
        // ssbConcerned.allCommunes = {};
        // ssbConcerned.supercluster = supercluster({
        //      extent: 6666,
        //      log: false,
        //      maxZoom: 16,
        //      radius: 2000,
        //  });
        // ssbConcerned.supercluster.load(this._vizLotService.dictionaries.limitesSSB[ssbLibelle].reperes);
        ssbConcerned.clusters = ssbConcerned.supercluster.getClusters([-180, -85, 180, 85], zoomLevel);
        ssbConcerned.tabClusters = [];
        ssbConcerned.clusters.forEach(cluster => {
          if(cluster.properties.cluster){
            ssbConcerned.tabClusters.push(cluster)
            this.dicoSsbClusters[ssbLibelle+'-'+cluster.properties.cluster_id] = cluster;
          }
        });
      }
    });
  }
  setSsbClustersOnMap(){
    this.markers.ssb = {};
    for(let clusterID in this.dicoSsbClusters){
      let el = document.getElementById(clusterID)
      el.classList.remove('hidden')
      this.markers.ssb[clusterID] = new mapboxgl.Marker(el,{offset: [-25, -25]})
      .setLngLat(this.dicoSsbClusters[clusterID].geometry.coordinates)
      .addTo(this.map)
    }
  }

  //init supercluster communes
  createCommunesClusters(){
    for(let idCommune in this._vizLotService.dictionaries.communesContainReperes){
      let identifiant = this._vizLotService.dictionaries.communesContainReperes[idCommune].reperes[0].properties.LIBELLE;
      this.allClusters[identifiant].allCommunes[idCommune] = this._vizLotService.dictionaries.communesContainReperes[idCommune];
      let  currentCommune = this.allClusters[identifiant].allCommunes[idCommune];
      let extent;
      this.modeClusteringCommunes == 'tight' ? extent = 100 : extent = 512
      currentCommune.supercluster = supercluster({
        extent: extent,
        log: false,
        maxZoom: 13,
      });
      //load reperes of the commune
      currentCommune.supercluster.load(this.allClusters[identifiant].allCommunes[idCommune].reperes);
    }
  }
  //get all infos about current zoom
  getCommunesClusters(zoomLevel){
    this.dicoLeaves = [];
    //each commune who have reperes
    for (let idCommune in this._vizLotService.dictionaries.communesContainReperes) {//this._vizLotService.dictionaries.communesContainReperes[idCommune]
      //to avoid length property
      if(this._vizLotService.dictionaries.communesContainReperes[idCommune].reperes){
        //store idCommune
        let identifiant = this._vizLotService.dictionaries.communesContainReperes[idCommune].reperes[0].properties.LIBELLE;
        //store reperes and info about commune
        this.allClusters[identifiant].allCommunes[idCommune] = this._vizLotService.dictionaries.communesContainReperes[idCommune];
        let currentCommune = this.allClusters[identifiant].allCommunes[idCommune];

        // currentCommune.supercluster = supercluster({
        //   extent: 512,
        //   log: false,
        //   maxZoom: 13,
        // });
        // //load reperes of the commune
        // currentCommune.supercluster.load(this.allClusters[identifiant].allCommunes[idCommune].reperes);

        //create one supercluster for the commune
        if(zoomLevel > 10){
          currentCommune.supercluster.options.extent = 512
        }else{
          currentCommune.supercluster.options.extent = 100
        }
        currentCommune.stuffs = this.allClusters[identifiant].allCommunes[idCommune].supercluster.getClusters([-180, -85, 180, 85], zoomLevel);
        currentCommune.tabClusters = [];
        currentCommune.unClusteredReperes = {};
        //store clusters
        currentCommune.stuffs.forEach(stuff => {
          if(stuff.properties.cluster){
            stuff.idCluster = idCommune+'-'+stuff.properties.cluster_id
            currentCommune.tabClusters.push(stuff)
            const leaves = currentCommune.supercluster.getLeaves(
              stuff.properties.cluster_id,
              zoomLevel,
              Infinity,
              0
            )
            this.dicoLeaves[idCommune+'-'+stuff.properties.cluster_id]= {}
            leaves.forEach(leave => {
              if(leave.properties.ID_REPR == "unknown"){
                this.dicoLeaves[idCommune+'-'+stuff.properties.cluster_id][leave.properties.DATE+'-'+leave.properties.ID_REPR+'-'+leave.properties.HAUTEUR] = leave
              }else{
                this.dicoLeaves[idCommune+'-'+stuff.properties.cluster_id][leave.properties.DATE+'-'+leave.properties.ID_REPR] = leave
              }
            });
          }else{
            //if no cluster, get the points
            if(stuff.properties.ID_REPR == "unknown"){
              currentCommune.unClusteredReperes[stuff.properties.DATE+'-'+stuff.properties.ID_REPR+'-'+stuff.properties.HAUTEUR] = stuff
              this.dicoAloneReperes[stuff.properties.DATE+'-'+stuff.properties.ID_REPR+'-'+stuff.properties.HAUTEUR] = stuff
            }else{
              currentCommune.unClusteredReperes[stuff.properties.DATE+'-'+stuff.properties.ID_REPR] = stuff
              this.dicoAloneReperes[stuff.properties.DATE+'-'+stuff.properties.ID_REPR] = stuff
            }
          }
        });
        //when there is/are clusters
        currentCommune.tabClusters.forEach(cluster => {
          var idCluster = currentCommune.commune.properties.COD_INSEE+'-'+cluster.properties.cluster_id
          this.dicoClusterCommune[idCluster]=cluster
          this.dicoClusterCommune[idCluster].commune=currentCommune.commune
          //set option cause cluster's display is diferent if single=true
          if(currentCommune.tabClusters.length == 1){
            if(Object.keys(currentCommune.unClusteredReperes).length < 1){
              this.dicoClusterCommune[idCluster].single = true;
            }else{
              this.dicoClusterCommune[idCluster].single = false;
            }
          }else if(currentCommune.tabClusters.length > 1){
            this.dicoClusterCommune[idCluster].single = false;
          }
        });
      }
    }
  }
  //display clusters and reperes
  setAloneReperesOnMap(){
    this.markers.reperes = {};
    for(let repereID in this.dicoAloneReperes){
      let el = document.getElementById(repereID)
      el.classList.remove('hidden')
      this.markers.reperes[repereID] = new mapboxgl.Marker(el,{offset: [-10, -10]})
      .setLngLat(this.dicoAloneReperes[repereID].geometry.coordinates)
      .addTo(this.map)
    }
  }
  setClusterCommuneOnMap(){
    this.markers.clusters = {};
    for(let clusterID in this.dicoClusterCommune){
      let el = document.getElementById(clusterID)
      el.classList.remove('hidden')
      if(this.dicoClusterCommune[clusterID].single == true){
        this.dicoClusterCommune[clusterID].coordsCenterCommune = polylabel(this.dicoClusterCommune[clusterID].commune.geometry.coordinates[0])
        this.markers.clusters[clusterID] = new mapboxgl.Marker(el,{offset: [-15, -15]})
        .setLngLat(this.dicoClusterCommune[clusterID].coordsCenterCommune)
        .addTo(this.map)
        //console.log(this.dicoClusterCommune[clusterID].commune.geometry.coordinates[0])
      }else if(this.dicoClusterCommune[clusterID].single == false){
        this.markers.clusters[clusterID] = new mapboxgl.Marker(el,{offset: [-15, -15]})
        .setLngLat(this.dicoClusterCommune[clusterID].geometry.coordinates)
        .addTo(this.map)
      }
    }
  }

  //highlights and resets markers
  _setMarkersHighLight(){
    this._resetMarkersHighlight()
    this.setClassRepereConcerned()
    this.setCommunesClusterHighLight()
  }
  _resetMarkersHighlight(){
    this._resetCommunesClusterHighLight();
    this._resetClassRepereConcerned();
  }
  //clusters
  setCommunesClusterHighLight(){
    var boolLeav,nbRepereByCluster;
    for(var leave in this.dicoLeaves){
      boolLeav = false;
      for (let rep in this.dicoLeaves[leave]){
        nbRepereByCluster=0
        this.tabReperesConcerned.forEach(repC => {
          if(this.dicoLeaves[leave][repC.properties.DATE+'-'+repC.properties.ID_REPR]||this.dicoLeaves[leave][repC.properties.DATE+'-'+repC.properties.ID_REPR+'-'+repC.properties.HAUTEUR]){
            boolLeav = true;
            nbRepereByCluster++
          }
        });
      }
      if(boolLeav){
        document.getElementById(leave).classList.remove('communeCluster')
        document.getElementById(leave).classList.add('communeClusterHighLight')
        this.dicoClusterCommune[leave].nbReperesHighLight = nbRepereByCluster
        // this.tabPopUp.push(new mapboxgl.Popup({closeOnClick: true, offset : [0, -13]})
        // .setLngLat(this.dicoClusterCommune[leave].geometry.coordinates)
        // .setText(nbRepereByCluster + " reperes ici")
        // .addTo(this.map))
      }
    }
  }
  _resetCommunesClusterHighLight(){

    for(var leave in this.dicoLeaves){
      if(document.getElementById(leave) && document.getElementById(leave).classList.contains('communeClusterHighLight')){
        document.getElementById(leave).classList.remove('communeClusterHighLight')
        document.getElementById(leave).classList.add('communeCluster')
      }
    }
  }
  _resetClusterHidden(){
    this.resetAlonesReperesSup()
    if(this.idsLastClusterDeleted.length> 0){
      document.getElementById(this.idsLastClusterDeleted[0]).classList.remove('hidden')
    }
  }
  // reperes
  setClassRepereConcerned(){
    let repereID;
    this.tabReperesConcerned.forEach(rep => {
      if(rep.properties.ID_REPR == "unknown"){
        repereID = rep.properties.DATE+'-'+rep.properties.ID_REPR+'-'+rep.properties.HAUTEUR
      }else{
        repereID = rep.properties.DATE+'-'+rep.properties.ID_REPR
      }
      if(document.getElementById(repereID)){
        document.getElementById(repereID).classList.remove("aloneReperes")
        document.getElementById(repereID).classList.remove("reperesSup")
        document.getElementById(repereID).classList.add("aloneReperesHighLight")
      }
    });
    //if want to display pop up on every reperes
    //this.addMultiPopUp(tabPopUp)
  }
  _resetClassRepereConcerned(){
    for(let repereID in this.dicoAloneReperes){
      if(document.getElementById(repereID)){
        document.getElementById(repereID).classList.remove("aloneReperesHighLight")
        document.getElementById(repereID).classList.add("aloneReperes")
      }
    }
  }
  resetClassReperesSup(){
    for(let repereID in this.dicoAloneReperesSup){
      if(document.getElementById(repereID)){
        document.getElementById(repereID).classList.remove("aloneReperesHighLight")
        document.getElementById(repereID).classList.add("reperesSup")
      }
    }
  }
  //clear dicos
  resetMarkers(){
    this.dicoSsbClusters= {};
    this.dicoAloneReperes = {};
    this.dicoClusterCommune = {};
  }

  //clicks events on html template
  clickRepere(repere,event){
    this.resetClassReperesSup()
    // console.log(repere)
    //console.log(event.target)
    // var markers = [{id: 0}, {id: 1}, {id: 2}, {id: 3}, {id: 4}];
    // this.test.spiderfy([1.2457468910291993, 45.01735471334072], markers,mapboxgl);
    // console.log(repere)
    this._vizLotService.resetMarkersHighlight();
    this.tabReperesConcerned = [];
    this.tabReperesConcerned.push(repere)
    setTimeout(()=>{
      this.setClassRepereConcerned();
    } ,50)
    // event.stopPropagation();
  }
  clickClusterCommune(cluster,event){
    this._resetClusterHidden()
    this.idsLastClusterDeleted = []
    this.idsLastClusterDeleted.push(cluster.idCluster)
    document.getElementById(cluster.idCluster).classList.add('hidden')
    for(let repereID in this.dicoLeaves[cluster.idCluster]){
      this.dicoAloneReperesSup[repereID]=this.dicoLeaves[cluster.idCluster][repereID]
    }
    this.addAloneReperesSupOnMap()

    //about tryin spiderfier
    // let merkers = [];
    // for(let itemClusterID in this.dicoLeaves[cluster.idCluster]){
    //   merkers.push(this.dicoLeaves[cluster.idCluster][itemClusterID])
    // }
    // if(this.dicoLeaves[cluster.idCluster].coordsCenterCommune){
    //   this.testSpiderfer.spiderfy(cluster.coordsCenterCommune, merkers,mapboxgl);
    // }else{
    //   this.testSpiderfer.spiderfy(cluster.geometry.coordinates, merkers,mapboxgl);
    // }
    event.stopPropagation();
  }
  clickOnSsbCluster(ssb){
    console.log(ssb.id)
  }
  mapClicked(event){
    console.log(event)
  }

  //mouse
  mouseOverClusterHighLight(cluster,event){
    if(document.getElementById(cluster.idCluster).classList.contains('communeClusterHighLight')){
      if(this.dicoClusterCommune[cluster.idCluster].coordsCenterCommune){
        this._addPopUp(this.dicoClusterCommune[cluster.idCluster].coordsCenterCommune,this.dicoClusterCommune[cluster.idCluster].nbReperesHighLight+' reperes ici')
      }else{
        this._addPopUp(cluster.geometry.coordinates,this.dicoClusterCommune[cluster.idCluster].nbReperesHighLight+' reperes ici')
      }
    }
  }
  mouseLeaveClusterHighLight(cluster,event){
    if(document.getElementById(cluster.idCluster).classList.contains('communeClusterHighLight')){
      this._removePopUp()
    }
  }
  mouseOverReperes(repere,event){
    if(document.getElementById(repere.properties.DATE+'-'+repere.properties.ID_REPR)||
      document.getElementById(repere.properties.DATE+'-'+repere.properties.ID_REPR+'-'+repere.properties.HAUTEUR)){
      this._addPopUp(repere.geometry.coordinates,"")
      this.pop.setHTML(`
        <h4><u>ID :</u> `+repere.properties.ID_REPR+`</h4>
        <h4><u>DATE :</u> `+repere.properties.DATE+`</h4>
        <h4><u>HAUTEUR :</u> `+repere.properties.HAUTEUR+`</h4>
      `)
    }
  }
  //reperes after cluster blowed
  addAloneReperesSupOnMap(){
    for(let repereID in this.dicoAloneReperesSup){
      let el = document.createElement("div")
      el.id = repereID
      el.classList.add('reperesSup')
      el.onclick = (e)=>{
        this.clickRepere(this.dicoAloneReperesSup[e.srcElement.id],e)
      }
      el.onmouseover = (e)=>{
        this.mouseOverReperes(this.dicoAloneReperesSup[e.srcElement.id],e)
      }
      this.markers.reperesSup[repereID] = new mapboxgl.Marker(el,{offset: [-10, -10]})
      .setLngLat(this.dicoAloneReperesSup[repereID].geometry.coordinates)
      .addTo(this.map)
    }
    this.setClassRepereConcerned()
  }
  resetAlonesReperesSup(){
    for(let marker in this.markers.reperesSup){
      this.markers.reperesSup[marker].remove()
    }
    this.markers.reperesSup= {}
    this.dicoAloneReperesSup = {}
  }

  getAsArray(object) {
    return Object.keys(object)
  }

  //Set methods to highlight adding elements to tabReperesConcerned
  _getReperesConcernedByDateAndId(date,id){
    this.tabReperesConcerned = [];
    this._vizLotService.geojsons.reperes.features.forEach((e) =>{
      if(e.properties.ID_REPR == id && e.properties.DATE == date){
        this.tabReperesConcerned.push(e)
      }
    })
    this._setMarkersHighLight()
  }
  _getReperesConcernedByYear(year){
    this.tabReperesConcerned = [];
    this._vizLotService.geojsons.reperes.features.forEach((e) =>{
      if(e.properties.ANNEE == year){
        this.tabReperesConcerned.push(e)
      }
    })
    this._setMarkersHighLight()
  }
  _getReperesConcernedById(id){
    this.tabReperesConcerned = [];
    this._vizLotService.geojsons.reperes.features.forEach((e) =>{
      if(e.properties.ID_REPR == id){
        this.tabReperesConcerned.push(e)
      }
    })
    this._setMarkersHighLight()
  }
  _getReperesConcernedByDate(date){
    this.tabReperesConcerned = [];
    this._vizLotService.geojsons.reperes.features.forEach((e) =>{
      if(e.properties.DATE == date){
        this.tabReperesConcerned.push(e)
      }
    })
    this._setMarkersHighLight()
  }

  //
  _clearTabReperesConcerned(){
    this.tabReperesConcerned = [];
  }

  //obj with lng and lat items
  _getCenterAndBboxNeSw(tab){
    let xS, xL, yS, yL, result,absc = [],ords = [];
    for (let i = 0; i < tab.length; i++) {
      absc.push(parseFloat(tab[i].lng))
      ords.push(parseFloat(tab[i].lat))
    }
    xS = Math.min.apply(null,absc)
    xL = Math.max.apply(null,absc)
    yS = Math.min.apply(null,ords)
    yL = Math.max.apply(null,ords)
    let x = (xS + xL)/2, y = (yS+yL)/2
    let ne = [xL,yL];
    let sw = [xS,yS];
    x.toString();
    y.toString();
    result = {center : [x,y], ne : ne, sw : sw};
    return result;
  }

  //methods mapbox basic
  _mapFitBounds(bbox,borderSize){
    this.map.fitBounds(bbox, {
      padding: {top: borderSize, bottom:borderSize, left: borderSize, right: borderSize}
    });
  }
  _mapFlyTo(zoom,center){
    this.map.flyTo(
      {zoom : zoom,
      center : center
    });
  }
  addMultiPopUp(tabPopUp){
    if(this.tabPopUp && this.tabPopUp.length > 0){
      this.tabPopUp.forEach(pop => {
        pop.remove()
      });
    }
    this.tabPopUp = []
    tabPopUp.forEach(pop => {
      this.tabPopUp.push(new mapboxgl.Popup({closeOnClick: true})
      .setLngLat(pop.coords)
      .setText(pop.content)
      .addTo(this.map))
    });
  }
  _addPopUp(coords,content){
    if(this.pop){
      this.pop.remove();
    }
    this.pop = new mapboxgl.Popup({closeOnClick: true});
    this.pop.setLngLat(coords)
    .setText(content)
    .addTo(this.map);
  }
  _removePopUp(){
    if(this.pop){
      this.pop.remove()
    }
  }
  clicked(){//test button
    // console.log("clusters",this.dicoClusterCommune)
    console.log("reperes", this.dicoAloneReperes)
    console.log('markers',this.markers)
    // document.getElementById('06/07/1993-LEM 12').classList.remove("aloneReperes")
    // document.getElementById('06/07/1993-LEM 12').classList.add("aloneReperesHighLight")

    //console.log('leaves',this.dicoLeaves)
    //console.log('allclusters',this.allClusters)
    console.log('concerned',this.tabReperesConcerned)
    // console.log(this.map.getZoom())
    //console.log('dicos',this._vizLotService.dictionaries)
  }

}
