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
            this.isValid = ko.observable(true);
            this.loaded = ko.observable(false);
            this.mapClosed = ko.observable(true);
            this.sidebarClosed = ko.observable(false);
            this.map = undefined;
            this.infoWindow = new google.maps.InfoWindow();
            this.markers = [];

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

            $(document).on('click', 'button[data-point]', function (e) {
                e.preventDefault();
                that.selectPoint($(e.target).data('point'));
            });

            $(document).keyup(function (e) {
                if (e.keyCode === 27) {
                    that.handleToggleMap();
                }
                if (e.keyCode === 13) {
                    that.postcodeSearch();
                }
            });

            // $('#acs-sp-postcode-search-trigger').click(function () {
            //     that.postcodeSearch();
            // });
        },
        getZipCode: function () {
            if (quote && quote.shippingAddress()) {
                return quote.shippingAddress().postcode;
            }
            return undefined;
        },
        isEnabled: function () {
            if (!this.data || !this.data.points || !this.data.points.length) {
                return false;
            }
            if (quote && quote.shippingMethod()) {
                if (quote.shippingMethod().carrier_code === 'AfterSalesProGrAcsPoints') {
                    return true;
                }
            }
            return false;
        },
        postcodeSearch: function () {
            const that = this;
            new google.maps.Geocoder().geocode({'address': this.getZipCode() + ' GR'}, function (results, status) {
                if (status === 'OK') {
                    that.map.setCenter(results[0].geometry.location);
                    that.map.setZoom(14);
                } else {
                    alert('Η αναζήτησή σας δεν βρήκε κάποια αποτελέσματα. Παρακαλώ εισάγετε τον Τ.Κ της περιοχής σας.');
                }
            });
        },
        getLocationFromPostcode: function (postcode) {
            return new google.maps.Geocoder().geocode({'address': postcode + ' GR'}, function (results, status) {
                if (status === 'OK') {
                    return results[0].geometry.location;
                }
            });
        },
        initMap: function (element) {
            this.addMap(element);
            this.addMarkers();
            this.addPointDetails();
            // const point_id = $.initNamespaceStorage('acs_points').localStorage.get('acs_points_point_id');
            // if (point_id) {
            //     this.selectPoint(point_id);
            // }
        },
        addMap: function (element) {
            let center = new google.maps.LatLng(38.0045296, 23.7144523);
            if (this.getZipCode()) {
                center = this.getLocationFromPostcode(this.getZipCode());
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
                    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
                });
            } catch (e) {
            } // MarkerClusterer not loaded correctly
        },
        addPointDetails: function () {
            const that = this;
            this.data.points.forEach(function (point, index) {
                google.maps.event.addListener(that.markers[index], 'click', function () {
                    that.openPoint(that.markers[index]);
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
                console.log('data', data);
            }).fail(function () {
                console.log('An error has occurred.');
            }).always(function () {
                that.loaded(true);
                console.log('data new', that.data);
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
        }
    });
});
