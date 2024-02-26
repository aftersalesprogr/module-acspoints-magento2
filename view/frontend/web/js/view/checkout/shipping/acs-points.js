define([
    'uiComponent',
    'ko',
    'Magento_Checkout/js/model/quote',
    'jquery',
    'matchMedia',
    "mage/storage",
    'Magento_Checkout/js/model/shipping-save-processor'
], function (Component, ko, quote, $, matchMedia, storage, processor) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'AfterSalesProGr_AcsPoints/checkout/shipping/acs-points'
        },
        initialize: function () {
            this._super();
            this.baseUrl = window.location.protocol + '//' + window.location.host + '/' + window.location.pathname.split('/')[0];
            this.filesUrl = this.baseUrl;
            this.data = ko.observable({});
            this.selectedPoint = ko.observable(undefined);
            this.pointDistance = ko.observable('');
            this.isValid = ko.observable(true);
            this.loaded = ko.observable(false);
            this.mapClosed = ko.observable(true);
            this.sidebarClosed = ko.observable(false);
            this.map = undefined;
            this.infoWindow = new google.maps.InfoWindow();
            this.markers = [];
            this.locationCache = {};

            const that = this;
            this.fetchLocations();
            this.focusPoint = function (point, event) {
                event.preventDefault();
                that.map.setCenter({
                    lat: parseFloat(point.lat),
                    lng: parseFloat(point.lon)
                });
                that.map.setZoom(14);
                var e = {
                    latLng: new google.maps.LatLng(point.lat, point.lon)
                };
                google.maps.event.trigger(that.markers.find(marker => marker.id === point.id), 'click', e);
            };

            mediaCheck({
                media: '(min-width: 1024px)',
                entry: function () {
                    that.sidebarClosed(false);
                },
                exit: function () {
                    that.sidebarClosed(true);
                }
            });

            $(document).on('blur', '[name="city"],[name="street[0]"],[name="street[1]"],[name="street[2]"]', function (e) {
                that.searchDistance()
            });

            $(document).on('click', 'button[data-point]', function (e) {
                e.preventDefault();
                that.selectPoint($(e.target).data('point'));
            });

            $(document).keyup(function (e) {
                if (!that.mapClosed() && e.keyCode === 27) {
                    that.handleToggleMap();
                }
                if (!that.mapClosed() && e.keyCode === 13) {
                    that.postcodeSearch();
                }
            });
        },
        getZipCode: function () {
            if (quote && quote.shippingAddress()) {
                return quote.shippingAddress().postcode;
            }
            return undefined;
        },
        getAddress: function () {
            if (quote && quote.shippingAddress()) {
                return quote.shippingAddress().street.join(' ') + ',' + quote.shippingAddress().city + ', ' + quote.shippingAddress().postcode;
            }
            return undefined;
        },
        isEnabled: function () {
            if (!this.data || !this.data.points || !this.data.points.length) {
                return false;
            }
            this.searchDistance()
            if (quote && quote.shippingMethod()) {
                if (quote.shippingMethod().carrier_code === 'AfterSalesProGrAcsPoints') {
                    return true;
                }
            }
            return false;
        },
        searchDistance: function () {
            if (quote && quote.shippingAddress() && this.getAddress()) {
                const that = this;
                if (that.locationCache[that.getAddress()]?.lat && that.locationCache[that.getAddress()]?.lng){
                    that.findNearestPoint(that.locationCache[that.getAddress()].lat, that.locationCache[that.getAddress()].lng, true);
                    return;
                }
                new google.maps.Geocoder().geocode({'address': that.getAddress() + ', GR'}, function (results, status) {
                    if (status === 'OK') {
                        that.locationCache[that.getAddress()] = {
                            lat: results[0].geometry.location.lat(),
                            lng: results[0].geometry.location.lng()
                        }
                        that.findNearestPoint(results[0].geometry.location.lat(), results[0].geometry.location.lng(), true);
                    }
                });
            }
        },
        postcodeSearch: function () {
            const that = this;
            new google.maps.Geocoder().geocode({'address': that.getAddress() + ', GR'}, function (results, status) {
                if (status === 'OK') {

                    if (that.markers['custom_marker'] !== undefined) {
                        that.markers['custom_marker'].setMap(null);
                    }

                    let is_address = results[0].types[0] == 'premise' || results[0].types[0] == 'street_address';
                    if (is_address) {
                        that.markers['custom_marker'] = new google.maps.Marker({
                            position: new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng()),
                            map: that.map,
                            id: 'custom-location'
                        });
                    }

                    that.findNearestPoint(results[0].geometry.location.lat(), results[0].geometry.location.lng(), is_address);
                    that.map.setCenter(results[0].geometry.location);
                    if (is_address) {
                        that.map.setZoom(16);
                    } else {
                        that.map.setZoom(14);
                    }
                }
            });
        },
        getLocationFromPostcode: function (address) {
            return new google.maps.Geocoder().geocode({'address': address + ', GR'}, function (results, status) {
                if (status === 'OK') {
                    return results[0].geometry.location;
                }
            });
        },
        getLocationFromAddress: function () {
            const address = this.getAddress()
            return new google.maps.Geocoder().geocode({'address': address + ', GR'}, function (results, status) {
                if (status === 'OK') {
                    return results[0].geometry.location;
                }
            });
        },
        initMap: function (element) {
            this.addMap(element);
            this.addMarkers();
            this.addPointDetails();
        },
        addMap: function (element) {
            let center = new google.maps.LatLng(38.0045296, 23.7144523);
            if (this.getAddress()) {
                center = this.getLocationFromPostcode(this.getAddress());
            }
            this.map = new google.maps.Map(element, {
                maxZoom: 16,
                zoom: 8,
                minZoom: 7,
                streetViewControl: false,
                disableDefaultUI: true,
                zoomControl: true,
                scrollWheel: true,
                draggable: true,
                gestureHandling: 'greedy',
                center: center,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [{
                    'featureType': 'administrative',
                    'elementType': 'labels.text.fill',
                    'stylers': [{'color': '#444'}]
                }, {
                    'featureType': 'landscape',
                    'elementType': 'all',
                    'stylers': [{'color': '#F2F2F2'}]
                }, {
                    'featureType': 'landscape',
                    'elementType': 'labels.text.fill',
                    'stylers': [{'saturation': '-34'}, {'visibility': 'on'}]
                }, {'featureType': 'poi', 'elementType': 'all', 'stylers': [{'visibility': 'off'}]}, {
                    'featureType': 'poi',
                    'elementType': 'geometry.fill',
                    'stylers': [{'hue': '#F00'}]
                }, {
                    'featureType': 'road',
                    'elementType': 'all',
                    'stylers': [{'saturation': -100}, {'lightness': 45}]
                }, {
                    'featureType': 'road.highway',
                    'elementType': 'all',
                    'stylers': [{'visibility': 'simplified'}]
                }, {
                    'featureType': 'road.arterial',
                    'elementType': 'labels.icon',
                    'stylers': [{'visibility': 'off'}]
                }, {
                    'featureType': 'transit',
                    'elementType': 'all',
                    'stylers': [{'visibility': 'off'}]
                }, {
                    'featureType': 'water',
                    'elementType': 'all',
                    'stylers': [{'color': '#156789'}, {'visibility': 'on'}]
                }]
            });
        },
        addMarkers: function () {
            this.markers = this.data.points.map((location, index) => {
                return new google.maps.Marker({
                    id: location.id,
                    position: new google.maps.LatLng(location.lat, location.lon),
                    map: this.map,
                    icon: location.icon,
                    counter: index
                });
            });
            try {
                new MarkerClusterer(this.map, this.markers, {
                    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                    maxZoom: 14
                });
            } catch (e) {
            }
        },
        addPointDetails: function () {
            const that = this;
            this.data.points.forEach(function (point, index) {
                const marker = that.markers[index];
                marker.set("id", that.markers[index].id);
                google.maps.event.addListener(marker, 'click', function () {
                    that.openPoint(marker);
                });
            });
        },
        openPoint: function (marker) {
            const point = this.data.points.find(point => point.id === marker.id);
            document.getElementById(point.id).scrollIntoView({
                block: 'center',
                behavior: 'smooth'
            });
            $('.acs-sp-sidebar-points-list').children().removeClass('active');
            document.getElementById(point.id).classList.add('active');

            const isSmartLocker = point.type === 'smartlocker';
            const notes = isSmartLocker ? `<div class="acs-sp-map-point-infobox-notes">Δυνατότητα πληρωμής με Visa/Mastercard.</div>` : '';
            const allDay = `<span class="acs-sp-allDayBadge">24ΩΡΟ</span>`;
            this.infoWindow.setContent(`
                <div class="acs-sp-map-point-infobox">
                    <div class="acs-sp-map-point-infobox-title">${point.title}</div>
                    <div class="acs-sp-map-point-infobox-address">${point.street}</div>
                    <div class="acs-sp-map-point-infobox-city">${point.city}</div>
                    ${notes}
                    <div class="acs-sp-map-point-infobox-hours">
                        ${isSmartLocker ? allDay : `<span class="acs-sp-allDayBadge">Δευτέρα-Παρασκευή: ${point.weekdays}<br>Σάββατο ${point.saturday}</span>`}
                    </div>
                    <button type="button" class="selected" data-point="${point.id}">Select</button>
                </div>
            `);
            this.infoWindow.open(this.map, marker);
        },
        selectPoint: function (id) {
            const point = this.data.points.find(point => point.id === id);
            this.selectedPoint(point);
            $.initNamespaceStorage('acs_points').localStorage.set('acs_points_point_id', point ? point.id : undefined);
            this.validate();
            processor.saveShippingInformation(quote.shippingAddress().getType())
            this.mapClosed(true);
        },
        validate: function () {
            if (this.selectedPoint) {
                if (this.selectedPoint.id && this.data.points.find(point => point.id === this.selectedPoint.id)) {
                    this.isValid = true;
                    return;
                }
            }
            this.isValid = false;
        },
        fetchLocations: function () {
            const that = this;
            $.getJSON(this.filesUrl + '/media/acs/acs-points.json', function (data) {
                that.data = data;
            }).fail(function () {
            }).always(function () {
                that.loaded(true);
            });
        },
        handleToggleSidebar: function () {
            this.sidebarClosed(!this.sidebarClosed());
        },
        handleToggleMap: function () {
            if (this.mapClosed()) {
                this.postcodeSearch();
            }
            this.mapClosed(!this.mapClosed());
        },
        calculateDistanceBetweenTwoCoordinatesInKm: function(lat1, lon1, lat2, lon2) {
            if ((lat1 === lat2) && (lon1 === lon2)) {
                return 0;
            }
            else {
                let radlat1 = Math.PI * lat1/180;
                let radlat2 = Math.PI * lat2/180;
                let theta = lon1-lon2;
                let radtheta = Math.PI * theta/180;
                let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180/Math.PI;
                dist = dist * 60 * 1.1515;
                return dist * 1.609344;
            }
        },
        findNearestPoint: function (lat, lng, is_address = true) {
            let min_distance = 1000000;
            let min_lat = null;
            let min_lng = null;
            let distance = null;

            for (let lcnt = 0; lcnt < this.data.points.length; lcnt++) {
                distance = this.calculateDistanceBetweenTwoCoordinatesInKm(lat, lng, this.data.points[lcnt].lat, this.data.points[lcnt].lon);
                if (min_distance > distance ) {
                    min_distance = distance;
                    min_lat = this.data.points[lcnt].lat;
                    min_lng = this.data.points[lcnt].lon;
                }
            }

            let distanceText = min_distance * 1000;
            let text = "";
            if (distanceText <= 3000) {
                distanceText = distanceText.toFixed(0);
                if (is_address) {
                    text += "Πλησιέστερο point: <strong>" +(distanceText)+ "</strong>m"
                } else {
                    text += "Υπάρχει ACS Point στην περιοχή σου";
                }
            }
            this.pointDistance(text)
            $('#label_carrier_courier_AfterSalesProGrAcsPoints').html(text);
        }
    });
});
