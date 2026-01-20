'use strict';
define([], function () {

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.mmRegion = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function Region(options) {
        const defaults = {
            initialized: false,
            directoryData: {},
            countryFieldId: '',
            regionListId: '',
            regionInputId: '',
            currentRegion: '',
            countryCode: ''
        }

        // extends config
        Object.assign(this, defaults, options);

        if (!this.initialized) {
            this.initialize(this.directoryData);
        }

        this.initRegion(
            this.countryFieldId,
            this.regionListId,
            this.regionInputId,
            this.currentRegion,
            this.countryCode
        );

        return this;
    }

    Region.prototype.initialize = function (directoryData) {
        this.directoryData = directoryData;
        this.initialized = !!this.directoryData;
        return this;
    }

    Region.prototype.initRegion = function (countryFieldId, regionListId, regionInputId, currentRegion, countryCode) {
        const self = this;
        if (countryCode) {
            this.setCountry(countryCode, regionListId, regionInputId, currentRegion);
        } else {
            const country = document.getElementById(countryFieldId);
            country.addEventListener('change', function () {
                self.setCountry(this.value, regionListId, regionInputId, currentRegion);
            });
            country.dispatchEvent(new CustomEvent('change'));
        }
        return this;
    }

    Region.prototype.setCountry = function (countryCode, regionListId, regionInputId, currentRegion) {
        if (this.directoryData[countryCode] && this.directoryData[countryCode]['regions']) {
            const regionList = document.getElementById(regionListId);
            regionList.length = 1;
            const regions = this.directoryData[countryCode].regions;
            for (const id in regions) {
                if (!regions.hasOwnProperty(id)) continue;

                const opt = document.createElement('option');
                opt.value = id;
                opt.innerHTML = regions[id].name;
                if (id === currentRegion) {
                    opt.selected = true;
                }
                regionList.appendChild(opt);
            }
            this.showList(regionListId, regionInputId);
        } else {
            this.showInput(regionListId, regionInputId);
        }
        return this;
    }

    Region.prototype.showList = function (idList, idInput) {
        document.getElementById(idList).style.display = "block";
        document.getElementById(idInput).style.display = "none";
        return this;
    }

    Region.prototype.showInput = function (idList, idInput) {
        document.getElementById(idList).style.display = "none";
        document.getElementById(idInput).style.display = "block";
        return this;
    }

    return Region;
}));

    let result = window.mmRegion;

    result.component = 'MageMe_WebFormsLite/js/region';

    return result;
});
