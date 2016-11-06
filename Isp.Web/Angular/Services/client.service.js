﻿(function() {
    'use strict';

    angular
        .module('app')
        .service('clientService', clientService);

    clientService.inject = ['$http', '$q', '$window', 'commonFactory'];

    function clientService($http, $q, $window, commonFactory) {
        var configs = $window.constants.configs;

        var service = {
            getGoogleImages: getGoogleImages,
            getBingImages: getBingImages,
            getShutterstockImages: getShutterstockImages
        };

        return service;

        ////////////////////

        function getGoogleImages(model) {
            return getImages(configs.googleApiUrl, model, paramsGoogleImages, successGoogleImages);
        }

        function paramsGoogleImages(model) {
            return {
                key: configs.googleApiKey,
                cx: configs.googleEngineId,
                searchType: 'image',
                fields: 'items(link,title),searchInformation',
                start: _.max([model.skip, 1]),
                num: _.min([model.take, 10]),
                q: model.query
            };
        }

        function successGoogleImages(response) {
            var i;
            var model = {};
            var resp = response.data;
            var itemsCount = 0;

            model.imageItems = [];
            if (commonFactory.isArrayNotNull(resp.items)) {
                itemsCount = resp.items.length;
                for (i = 0; i < itemsCount; i++) {
                    var iter = resp.items[i];

                    model.imageItems.push({
                        link: iter.link,
                        title: iter.title
                    });
                }
            }

            if (commonFactory.isObject(resp.searchInformation)) {
                model.totalCount = commonFactory.isStringNotNull(resp.searchInformation.totalResults)
                    ? resp.searchInformation.totalResults
                    : itemsCount.toString();

                model.time = commonFactory.isNumber(resp.searchInformation.searchTime)
                    ? resp.searchInformation.searchTime
                    : undefined;
            }

            return model;
        }

        ////////////////////

        function getBingImages(model) {
            var headers = {
                'Ocp-Apim-Subscription-Key': configs.bingApiKey
            };

            return getImages(configs.bingApiUrl, model, paramsBingImages, successBingImages, headers);
        }

        function paramsBingImages(model) {
            return {
                q: model.query,
                count: _.min([model.take, 150]),
                offset: _.max([model.skip, 0])
            };
        }

        function successBingImages(response) {
            var i;
            var model = {};
            var resp = response.data;
            var itemsCount = 0;

            model.imageItems = [];
            if (commonFactory.isArrayNotNull(resp.value)) {
                itemsCount = resp.value.length;
                for (i = 0; i < itemsCount; i++) {
                    var iter = resp.value[i];

                    model.imageItems.push({
                        link: iter.contentUrl,
                        title: iter.name
                    });
                }
            }

            model.totalCount = commonFactory.isNumber(resp.totalEstimatedMatches)
                ? resp.totalEstimatedMatches.toString()
                : itemsCount.toString();

            return model;
        }

        ////////////////////

        function getShutterstockImages(model) {
            var headers = {
                'Authorization': 'Basic ' + configs.shutterstockCredentials,
                'X-Requested-With': undefined
            };

            return getImages(configs.shutterstockApiUrl, model, paramsShutterstockImages, successShutterstockImages,
                headers);
        }

        function paramsShutterstockImages(model) {
            return {
                query: model.query,
                sort: 'relevance',
                license: ['commercial', 'editorial', 'enhanced', 'sensitive', 'NOT enhanced', 'NOT sensitive'],
                page: _.max([model.skip, 1]),
                per_page: _.min([model.take, 500])
            };
        }

        function successShutterstockImages(response) {
            var i;
            var model = {};
            var resp = response.data;
            var itemsCount = 0;

            model.imageItems = [];
            if (commonFactory.isArrayNotNull(resp.data)) {
                itemsCount = resp.data.length;
                for (i = 0; i < itemsCount; i++) {
                    var iter = resp.data[i];
                    var link = commonFactory.isObject(iter.assets) && commonFactory.isObject(iter.assets.preview)
                        ? iter.assets.preview.url
                        : null;

                    model.imageItems.push({
                        link: link,
                        title: iter.description
                    });
                }
            }

            model.totalCount = commonFactory.isNumber(resp.totalCount)
                ? resp.totalCount.toString()
                : itemsCount.toString();

            return model;
        }

        ////////////////////

        function getImages(apiUrl, model, requestParams, requestSuccess, headers) {
            var start = performance.now();

            if (!commonFactory.isStringNotNull(apiUrl)
                || !commonFactory.isObject(model)
                || !_.isFunction(requestParams)
                || !_.isFunction(requestSuccess)) {
                $q.reject();
            }

            var params = requestParams(model);

            return $http.get(apiUrl, {
                    params: params,
                    headers: headers
                })
                .then(function(resp) {
                    var respParsed = requestSuccess(resp);
                    var stop = performance.now();

                    return requestResponse(respParsed, start, stop);
                }, requestFailure);
        }

        function requestResponse(obj, start, stop) {
            var time = _.round(stop - start, 6);

            var objTimeString = '';
            if (commonFactory.isNumber(obj.time)) {
                var millis = _.round(obj.time * 1000, 6);
                objTimeString = millis.toString() + 'ms';
            }

            return {
                imageFetch: {
                    imageItems: obj.imageItems,
                    totalCount: obj.totalCount,
                    time: obj.time,
                    timeString: objTimeString
                },
                time: time,
                timeString: time.toString() + ' ms'
            };
        }

        function requestFailure(error) {
            return commonFactory.requestFailure(error);
        }
    }
})();