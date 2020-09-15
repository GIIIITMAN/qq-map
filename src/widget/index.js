// Class, jQuery, Enhancer are global objects that you can use them anywhere
// referer to #doc...

require('./index.less');
var locale = require('./i18n');
var tpl = require('./index.html');

Enhancer.registerWidget({
    /**
     * Widget Constructing Function
     * @param profile {Object} The widget profile which is configurated by 
     *   widget configurator.
     * @param zContext {Object} Current context which contains the dependent
     *    variable values of this widget.
     */
    construct: function(profile, zContext) {
        var self = this;

        var $container = self.getContainer();
        $container.addClass('widget-qq-map');

        $container.html(tpl({
            locale: locale()
        }));

        self._addons = [];
        self._bindingTriggers = [];
        self.getMap = function() {
            return self._mapWidget || {};
        }

        if (profile.widgetOptions && profile.widgetOptions.dependencies) {
            for(let key in profile.widgetOptions.dependencies) {
                self._bindingTriggers.push({
                    name: profile.widgetOptions.dependencies[key],
                    trigger: function(widget, value) {
                        widget._mapGeocoder.getLocation(value);
                    }
                });
            }
        }

        let containerId = "qq-map-container-" + (new Date().getTime());
        let mapSearchBarId = "map-search-bar-" + (new Date().getTime());
        let mapContextMenuId = "mapContextMenu-" + (new Date().getTime());
        $container.find('.qq-map-container').prop("id", containerId);
        $container.find('.map-search-bar').find('input').prop("id", mapSearchBarId);
        $container.find('.mapContextMenu').prop("id", mapContextMenuId);

        //右键菜单
        $("body").on("click", function() {
            $('#' + mapContextMenuId).hide();
        })
        $('#' + mapContextMenuId).hide();
        if (profile.widgetOptions.contextMenu && profile.widgetOptions.contextMenu.length !== 0) {
            let ctxtMenu = $('#' + mapContextMenuId);
            $(profile.widgetOptions.contextMenu.split(",")).each(function(i, item) {
                let menuItem = $('<div></div>');
                menuItem.text(item);
                menuItem.on("click", function() {
                    self.trig("contextMenu-" + i);
                });
                ctxtMenu.append(menuItem);
            });
        }

        var mapScriptParser = function(doc) {
            let checkTaskId = null;
            return new Promise(function(resolve, reject) {
                // load qq map script
                Function(doc)();
                // check if map constructor is ready per min
                checkTaskId = setInterval(function() {
                    if (isMapLibLoaded()) {
                        clearInterval(checkTaskId);
                        resolve(checkTaskId);
                    }
                }, 1000);
            });
        }

        var isMapLibLoaded = function() {
            if (typeof window.qq === 'undefined') {
                return false;
            }
            return qq && qq.maps && qq.maps.Map;
        }

        var parseDataAndBuild = function(location) {
            let lat = profile.widgetOptions.center.lat || location && location.latitude;
            let lng = profile.widgetOptions.center.lng || location && location.longitude;
            if (profile.dataSourceId) {
                self.getSourceData(profile.dataSourceId, (data) => {
                    buildMapWidget({latitude: lat, longitude: lng, source: data || {}});
                    self.trig('complete');
                    return $container;
                });
            } else {
                buildMapWidget({latitude: lat, longitude: lng, source: {}});
                self.trig('complete');
                return $container;
            }
        }

        var renderInfoWindow = function(infoWin, data, panel) {
            if (!panel) {
                infoWin.setContent('<div style="font-size: 14px;color: #2E64Fe">'
                    + (data.name ? data.name : '')
                    + '</div><div style="font-size: 12px;">'
                    + (data.address ? data.address : '')
                    + '</div><div style="font-size: 12px;">'
                    + (data.phone ? data.phone : '')
                    + (data.html ? data.html : '')
                    + '</div>'
                );
            } else {
                let tmpl = panel.template;
                tmpl = tmpl.replace(/\{\{name\}\}/g, (data.name || '')).replace(/\{\{address\}\}/g, (data.address || '')).replace(/\{\{phone\}\}/g, (data.phone || ''));
                infoWin.setContent('<div style="font-size:12px;' 
                    + (panel.width ? 'width:' + panel.width + 'px;' : '')
                    + (panel.height ? 'height:' + panel.height + 'px;' : '')
                    + '">'
                    + tmpl
                    + (data.html ? data.html : '')
                    + '</div>'
                );
            }
        }

        var createMapInstance = function() {
            if (!self._mapGeocoder) {
                self._mapGeocoder = new qq.maps.Geocoder({
                    complete: function(result) {
                        self._mapWidget.panTo(result.detail.location);
                    }
                });
            }
            if (!self._mapSearchService) {
                self._mapSearchService = new qq.maps.SearchService({
                    complete : function(results){
                       if(results.type === "CITY_LIST") {
                            self._mapSearchService.setLocation(results.detail.cities[0].cityName);
                            self._mapSearchService.search(self._keyword);
                            return;
                        }
                        self._searchResult = results.detail.pois;
                        let latlngBounds = new qq.maps.LatLngBounds();
                        let infoWin = new qq.maps.InfoWindow({
                            map: self._mapWidget
                        });
                        for(let index in self._searchResult){
                            let poi = self._searchResult[index];
                            latlngBounds.extend(poi.latLng);  
                            let marker = new qq.maps.Marker({
                                map: self._mapWidget,
                                position: poi.latLng
                            });

                            marker.setTitle(poi.name);

                            if (profile.widgetOptions.enablePOI) {
                                qq.maps.event.addListener(marker, 'click', function(mevent) {
                                    infoWin.open();
                                    if (profile.panel) {
                                        renderInfoWindow(infoWin, poi, profile.panel);
                                    } else {
                                        renderInfoWindow(infoWin, poi);
                                    }
                                    infoWin.setPosition(poi.latLng);
                                    self._position = mevent.latLng;
                                    self._pointInfo = poi;
                                    self.trig("onMarkerClick");
                                });
                            }
                        }
                        self._mapWidget.fitBounds(latlngBounds);
                        self.trig("onSearchDone");
                    }
                });
            }
            if (profile.widgetOptions.auto) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    // user would be asked to allow getting current location
                    if (position.coords) {
                        parseDataAndBuild(position.coords);
                    }
                });
            } else {
                parseDataAndBuild();
            }
        }

        var buildMapWidget = function({latitude, longitude, source}) {
            self._position = {lat: latitude, lng: longitude};
            self._mapWidget = new qq.maps.Map(document.getElementById(containerId), {
                center: new qq.maps.LatLng(
                    latitude,
                    longitude),     // geo-center point
            });
            if (profile.widgetOptions && profile.widgetOptions.mapOptions) {
                let zoomLvl = profile.widgetOptions.mapOptions.minZoom +
                    Math.floor((profile.widgetOptions.mapOptions.maxZoom -
                        profile.widgetOptions.mapOptions.minZoom) / 2);
                self._mapWidget.setOptions({
                    ...profile.widgetOptions.mapOptions
                    , zoom: zoomLvl
                });
            }
            if (profile.widgetOptions.trafficLayer) {
                let layer = new qq.maps.TrafficLayer();
                layer.setMap(self._mapWidget);
                self._addons.push(layer);
            }
            if (profile.widgetOptions.enableSearch) {
                $('#' + mapSearchBarId).parent().removeClass('hidden');
                qq.maps.event.addListener(
                    new qq.maps.place.Autocomplete(document.getElementById(mapSearchBarId)),
                    "confirm",
                    function(res){
                        self._keyword = res.value;
                        self._mapSearchService.search(self._keyword);
                });
            }
            qq.maps.event.addListener(self._mapWidget, 'click', function(event) {
                if (profile.widgetOptions.markOnClick) {
                    let marker=new qq.maps.Marker({
                        position: event.latLng, 
                        map: self._mapWidget
                    });
                    qq.maps.event.addListener(marker, 'click', function(mevent) {
                        self._position = mevent.latLng;
                        self._pointInfo = {};
                        self.trig("onMarkerClick");
                    });
                }
                self._position = event.latLng;
                self.trig("onClick");
            });
            if (profile.widgetOptions.contextMenu && profile.widgetOptions.contextMenu.length !== 0) {
                qq.maps.event.addListener(self._mapWidget, 'rightclick', function(event) {
                    $('#' + mapContextMenuId).css("top", event.pixel.y);
                    $('#' + mapContextMenuId).css("left", event.pixel.x);
                    $('#' + mapContextMenuId).show();
                    self._position = event.latLng;
                    self.trig("onShowMenu");
                });
            }
            processData(source);
        }

        var buildOnMapItem = function(item) {
            let options = item.options || {};
            let infoWin = new qq.maps.InfoWindow({
                map: self._mapWidget
            });
            switch(item.type.toLowerCase()) {
                case "marker":
                    $(item.points).each(function(i, point) {
                        var latlng = new qq.maps.LatLng(point.lat, point.lng);
                        qq.maps.event.addListener(
                            new qq.maps.Marker({
                                map: self._mapWidget,
                                position: latlng,
                                ...options,
                                ...point
                            }),
                            'click',
                            function(mevent) {
                                infoWin.open();
                                renderInfoWindow(infoWin, point, profile.panel);
                                infoWin.setPosition(latlng);
                                self._pointInfo = point;
                                self.trig('onMarkerClick');
                            }
                        );
                    });
                    break;
                case "label":
                    $(item.points).each(function(i, point) {
                        new qq.maps.Label({
                            map: self._mapWidget,
                            position: new qq.maps.LatLng(point.lat, point.lng),
                            ...options,
                            ...point
                        });
                    });
                    break;
                case "circle":
                    $(item.points).each(function(i, point) {
                        new qq.maps.Circle({
                            map: self._mapWidget,
                            center: new qq.maps.LatLng(point.lat, point.lng),
                            ...options,
                            ...point
                        });
                    })
                    break;
                case "polyline":
                    let path = item.points.map(function(point) {
                        return new qq.maps.LatLng(point.lat, point.lng);
                    });
                    new qq.maps.Polyline({
                        map: self._mapWidget,
                        path: path,
                        ...options
                    });
                    break;
                case "polygon":
                    let paths = item.points.map(function(points) {
                        return points.map(function(point) {
                            return new qq.maps.LatLng(point.lat, point.lng);
                        });
                    });
                    new qq.maps.Polygon({
                        map: self._mapWidget,
                        path: paths,
                        ...options
                    });
                    break;
                default:
                    console && console.warn("Map overlay type not matched!");
            }
        }

        var processData = function({rows}) {
            if (!rows) {
                return false;
            }
            $(rows).each(function(i, item) {
                if (item && item.type && item.points) {
                    buildOnMapItem(item);
                }
            });
        }

        self._mapWidget = null;
        if (profile && profile.apiKey) {
            self._apiKey = profile.apiKey;
            if (!isMapLibLoaded()) {
                $.ajax({
                    url: "https://map.qq.com/api/js?v=2.exp&libraries=place&key=" + this._apiKey,
                    dataType: "text",
                    success: function(scriptDoc) {
                        /*
                        * as the browser does not allow 'document.write' after document finished loading,
                        * using DOM operation instead $('body').append(...).
                        */
                        let doc = scriptDoc.replace("document.write", "$(\"body\").append");
                        mapScriptParser(doc).then(function(taskId) {
                            self.trig('onLibReady');
                            createMapInstance();
                        });
                    }
                });
            } else {
                self.trig('onLibReady');
                createMapInstance();
            }
        } else {
            $('#' + containerId).addClass("hidden");
            $container.find('.err-msg').removeClass("hidden");
            self.trig('complete');
            return $container;
        }

        // // Must trigger the complete event when the widget is completed.
        // self.trig('complete');
        // return $container;
    },

    /**
     * onFrameReady {Function} [Optional] This function will be called after all widget complete events
     *   are triggered first time in this frame, which means the frame to where this widget is belong
     *   is ready. If necessary, handle sth in this function to make sure the code will be executed as
     *   you expected.
     * @param zContext {Object} Current context which contains the dependent
     *    variable values of this widget.
     */
    onFrameReady: function(zContext) {

    },

    /**
     * getData {Function} Each widget instance should contain the data of variables
     *   which are declared by widget-configurator when the widget is bound in this 
     *   window and the `getSupportedVariables` method of widget-configurator is 
     *   called. It is recommend to return default data which are specified by app
     *   developer in widget-configurator maybe so that there are available data 
     *   used by other depended window when this widget is initilized as primary.
     * @return {Object} The data of variables.
     */
    getData: function() {
        return {
            keyword: this._keyword || '',
            result: this._searchResult || [],
            latitude: this._position ? this._position.lat : '',
            longitude: this._position ? this._position.lng : '',
            point: this._pointInfo ? this._pointInfo : {},
        };
    },

    /**
     * isValid {Function} The Enhancer will call this method to check if the data of
     *   this widget is available so that to controll next action to response the event.
     * @return {Boolean/Promise} whether the data is valid or available. if a Promise object
     * is returned, the parameter of callback of promise.then method must be a boolean.
     */
    isValid: function() {
        return !!this._mapWidget;
    },

    /**
     * affected {Function} This method will be called when some event is triggered
     *   and this widget should be affected following the operating flow diagram.  
     * @param zContext {Object} Current context which contains the dependent
     *    variable values of this widget.
     */
    affected: function(zContext) {
        let data = zContext.data;
        let self = this;
        $(this._bindingTriggers).each(function(i, binding) {
            if (binding.name && binding.trigger) {
                binding.trigger(self, data[binding.name]);
            }
        });
    },

    /**
     * onResize {Function} [Optional] This function will be called after the size 
     * of widget container changed. If the dimension of this widget can not fit the
     * change automatically, the is method should be implemented to adjust the width
     * and height.
     */
    onResize: function(zContext) {
        
    },
    
    /**
     * destroy {Function} [Optional] This function will be called if user reset or destroy
     * this widget. Some works should be done to recycle resouces occupied by this widget.
     */
    destroy: function() {

    }
});

