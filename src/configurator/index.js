/**
 * Widget Configurator Sample
 * The input and output of the configurator is the profile of its corressponding 
 * widget.
 * @author 
 * @created
 */

var locale = require('./i18n');
var template = require('./index.html');
require('../lib/jquery-te-1.4.0.css');
require('../lib/jquery-te-1.4.0.min.js');
require('./index.less');

var configurator = {
  construct: function() {
    let self = this;
    var tplHTML = template({
      locale: locale()
    });
    $('body').html(tplHTML);
    
    $('.htmlEditor').jqte({
      change: function(){
      }
    });
    self._panelEl = $('.htmlEditor'); // cache object after generate the editor

    var restoreEditor = function({width, height, template}) {
      $('input[name=panelWidth]').val(width);
      $('input[name=panelHeight]').val(height);
      self._panelEl.jqteVal(template);
    }

    var restoreOverlay = function(overlayData) {
      $('input[name=overlayX]').val(overlayData.x);
      $('input[name=overlayY]').val(overlayData.y);
      $('input[name=overlayName]').val(overlayData.overlayName);
      restoreEditor(overlayData);
    }

    $('#previewBtn').on('click', function() {
      $('#preview').css("width", $('input[name=panelWidth]').val());
      $('#preview').css("height", $('input[name=panelHeight]').val());
      $('#preview').html(self._panelEl.val());
    });
    var panelControl = function() {
      $('#dataSourceDom').toggle();
      $('.html-editor-container').toggle();
    }
    $('#saveBtn').on('click', function() {
      let tmpl = self._panelEl.val();
      let pWidth = $('input[name=panelWidth]').val();
      let pHeight = $('input[name=panelHeight]').val();
      if (self.profile) {
        self.profile.panel = {
          width: pWidth,
          height: pHeight,
          template: tmpl
        };
      }
      panelControl();
    });
    $('#backBtn').on('click', function() {
      panelControl();
    });
    $('#editorPanBtn').on('click', function() {
      if (self.profile && self.profile.panel) {
        restoreEditor(self.profile.panel)
      }
      panelControl();
    });
    // $('#saveAsBtn').on('click', function() {
    //   if (self.profile) {
    //     if (!self.profile.overlays) {
    //       self.profile.overlays = [];
    //     }
    //     self.profile.overlays.push({

    //     });
    //   }
    //   panelControl();
    // });

    $('.html-editor-container').toggle();
  },

  initDataSource: function () {
    const dataSpecification = `{
      // 只支持JSON格式数据
      "rows": [
        {
          "type": "xxx", // ${locale('sampleType')}
          "points": [{"lat": 123, "lng": 456}], // ${locale('samplePoints')}
          "options": {"xxx":"xxx"} // ${locale('sampleOptions')}
        }
      ]
    }`;
    this.dataSourceConfig = Enhancer.DatasourceManager.createConfigurator('dataSourceDom', {
      supportedTypes: ['rdb', 'http', 'static', 'jsonp'],
      dataSpecification: dataSpecification, // 组件数据格式说明 
      onSave: (source) => {
        this.profile.dataSourceId = source.id;
      }
    });

    if (this.profile.dataSourceId) {
      Enhancer.DatasourceManager.getDatasource(this.profile.dataSourceId, (source) => {
        this.dataSourceConfig.setConfig(source);
      });
    }
  },

  /**
   * @setProfile {Function} [required] Will be called when user decides to  
   * config the widget on workbench.
   * @param profile {Object} The profile of corresponding widget.
   */
  setProfile: function(profile) {
    var self = this;
    this.profile = profile || {};
    this.initDataSource();

    if (profile.apiKey) {
      $('input[name=apiKey]').val(profile.apiKey);
    }
    if (profile.widgetOptions) {
      $('input[name=autoPosition]').prop('checked', profile.widgetOptions.auto);
      $('input[name=trafficLayer]').prop('checked', profile.widgetOptions.trafficLayer);
      $('input[name=enablePOI]').prop('checked', profile.widgetOptions.enablePOI);
      $('input[name=enableSearch]').prop('checked', profile.widgetOptions.enableSearch);
      $('input[name=markOnClick]').prop('checked', profile.widgetOptions.markOnClick);
      $('input[name=boundLocation]').val(profile.widgetOptions.dependencies ? profile.widgetOptions.dependencies.boundLocation : null);
      $('input[name=contextMenu').val(profile.widgetOptions.contextMenu);
      if (profile.widgetOptions.mapOptions) {
        $('input[name=kbdEnabled]').prop('checked', profile.widgetOptions.mapOptions.keyboardShortcuts);
        $('input[name=wheelEnabled]').prop('checked', profile.widgetOptions.mapOptions.scrollwheel);
        $('input[name=draggable]').prop('checked', profile.widgetOptions.mapOptions.draggable);
        $('input[name=doubleClick]').prop('checked', profile.widgetOptions.mapOptions.disableDoubleClickZoom);
        $('input[name=zoomMin]').val(profile.widgetOptions.mapOptions.minZoom);
        $('input[name=zoomMax]').val(profile.widgetOptions.mapOptions.maxZoom);
        $('input[name=disableUI]').prop('checked', profile.widgetOptions.mapOptions.disableDefaultUI);
        $('input[name=scaleCtrl').prop('checked', profile.widgetOptions.mapOptions.scaleControl);
        $('input[name=mapTypeCtrl').prop('checked', profile.widgetOptions.mapOptions.mapTypeControl);
      }
      if (profile.widgetOptions.center) {
        $('input[name=latitude]').val(profile.widgetOptions.center.lat);
        $('input[name=longitude]').val(profile.widgetOptions.center.lng);
      }
    }
    if (profile.overlays) {
      let overlaySel = $('#overlaySelect');
      $(profile.overlays).each(function(i, overlay) {
        overlaySel.append('<option value="' + overlay.overlayName + '">' + overlay.overlayName + '</option>');
      });
    }
  },
  /**
   * @getProfile {Function} [required] Will be called when user click the save
   * button which is on the bottom of the configurator dialog. Note that if the
   * profile is invalid which is configurated by user, you should gave tips to
   * user and return false to prevent this save operation.
   * @return {Object} profile
   */
  getProfile: function() {
    if (!this.profile) {
      return false;
    }
    this.profile.apiKey = $('input[name=apiKey]').val() || '';
    this.profile.apiKey = this.profile.apiKey.replace(/[<>/]/g, '');
    $('input[name=apiKey]').val(this.profile.apiKey);

    let mxZ = parseInt($('input[name=zoomMax]').val() || 18);
    let mnZ = parseInt($('input[name=zoomMin]').val() || 1);
    mnZ = mnZ < 1 ? 1 : mnZ;
    mxZ = mxZ < mnZ ? mnZ + 1 : mxZ;
    $('input[name=zoomMin]').val(mnZ);
    $('input[name=zoomMax]').val(mxZ);

    this.profile.widgetOptions = {
      auto: $('input[name=autoPosition]').prop('checked') && !$('input[name=latitude]').val() && !$('input[name=longitude]').val(),
      center: {
        lat: $('input[name=latitude]').val(),
        lng: $('input[name=longitude]').val()
      },
      trafficLayer: $('input[name=trafficLayer]').prop('checked'),
      enablePOI: $('input[name=enablePOI]').prop('checked'),
      enableSearch: $('input[name=enableSearch]').prop('checked'),
      markOnClick: $('input[name=markOnClick]').prop('checked'),
      contextMenu: $('input[name=contextMenu]').val(),
      mapOptions: {
        keyboardShortcuts: $('input[name=kbdEnabled]').prop('checked'),
        scrollwheel: $('input[name=wheelEnabled]').prop('checked'),
        draggable: $('input[name=draggable]').prop('checked'),
        disableDoubleClickZoom: $('input[name=doubleClick]').prop('checked'),
        disableDefaultUI: $('input[name=disableUI]').prop('checked'),
        scaleControl: $('input[name=scaleCtrl').prop('checked'),
        mapTypeControl: $('input[name=mapTypeCtrl').prop('checked'),
        minZoom: mnZ,
        maxZoom: mxZ,
      },
      dependencies: {
        boundLocation: $('input[name=boundLocation]').val(),
      },
    };
    return this.profile;
  },
  /**
   * @getSupportedEventList {Function} [optional] This method will be called if
   * implemented when the user click the save button to gather the events which
   * will be triggered in runtime by the widget instance. Note that the supported 
   * events would be different with the different profiles configurated by user in
   * the same type widget. 
   * @param profile {Object} The profile returned by getProfile() method which will be
   *   called before this method calling.
   * @return {Array<Object>} EventList
   */
  getSupportedEventList: function(profile) {
    let ctxtMenuEvents = [];
    if (profile.widgetOptions.contextMenu) {
      let ctxtMenuItems = profile.widgetOptions.contextMenu.split(',');
      ctxtMenuEvents = ctxtMenuItems.map(function(item, i) {
        return {
          id: "contextMenu-" + i,
          name: item,
          desc: item
        }
      });
    }
    let events = [{
        id: "onSearchDone",
        name: "搜索完成",
        des: "搜索结果返回触发"
      },
      {
        id: "onMarkerClick",
        name: "点击标记",
        des: "点击标记触发"
      },
      {
        id: "onClick",
        name: "点击地图",
        des: "点击地图触发"
      },
      {
        id: "onLibReady",
        name: "JS库加载成功",
        des: "初始化组件时地图库异步加载完成触发"
      },
      {
        id: "onShowMenu",
        name: "右键菜单",
        des: "打开右键菜单时触发"
      }
      // , ...
    ];
    let arr = events.concat(ctxtMenuEvents);
    return arr;
  },
  /**
   * @getSupportedVariableList {Function} [optional] This method will be called if
   * implemented when the user click the save button, to gather the variables owned
   * by the widget instance. Note that the supported variables would be different with 
   * the different profiles configurated by user in the same type widget.
   * @param profile {Object} The profile returned by getProfile() method which will be
   *   called before this method calling.
   * @return VariableList {Array<Object>} 
   **/
  getSupportedVariableList: function(profile) {

    // TODO: Add your code here to return different variable list following
    // current configurated profile.

    // Variable list example
    return [{
        // Variable name [required]
        name: 'KEYWORD',
        // Variable type [optional default string]
        type: 'string',
        // Variable description
        des: '搜索关键字'
      },
      {
        name: 'RESULT',
        type: 'string',
        des: '搜索结果'
      },
      {
        name: 'LATITUDE',
        type: 'number',
        des: '选中点的纬度值'
      },
      {
        name: 'LONGITUDE',
        type: 'number',
        des: '选中点的经度值'
      },
      {
        name: 'POINT',
        type: 'object',
        des: 'marker可用，标记点对象'
      }
      // , ...
    ];
  },
  /**
   * @getDependentVariableList {Function} [optional] This method is repsonsible
   * for gathering the variable names dependent by this widget from context.
   * @param profile {Object} The profile returned by getProfile() method which will be
   *   called before this method calling.
   * @return {Array<String>}
   */
  getDependentVariableList: function(profile) {
    // Variable List example
    let list = [];
    if (profile.widgetOptions.dependencies && profile.widgetOptions.dependencies.boundLocation) {
      list.push(profile.widgetOptions.dependencies.boundLocation);
    }
    return list;
  }
};

// register configurator
Enhancer.registerWidgetConfigurator(configurator);