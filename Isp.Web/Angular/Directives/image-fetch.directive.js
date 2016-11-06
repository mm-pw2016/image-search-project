﻿(function() {
    'use strict';

    angular
        .module('app')
        .directive('imageFetch', imageFetch)
        .controller('ImageFetchController', ImageFetchController);

    function imageFetch() {
        var directive = {
            controller: 'ImageFetchController as vm',
            restrict: 'EA',
            templateUrl: 'image-fetch.html',
            scope: {},
            bindToController: {
                name: '@',
                data: '=',
                marginAfter: '=?'
            }
        };

        return directive;
    }

    ImageFetchController.$inject = ['$scope', 'commonFactory'];

    function ImageFetchController($scope, commonFactory) {
        var vm = this;

        vm.marginAfter = commonFactory.isBool(vm.marginAfter) ? vm.marginAfter : true;

        $scope.$watch('vm.data', function() {
            parse();
        });

        ////////////////////

        function parse() {
            if (commonFactory.isObject(vm.data)) {
                timeToString(vm.data);

                if (commonFactory.isObject(vm.data.imageFetch)) {
                    timeToString(vm.data.imageFetch);
                }
            }
        }

        function timeToString(obj) {
            if (commonFactory.isNumber(obj.time) && obj.time > 0 && commonFactory.isStringNotNull(obj.timeString)) {
                obj.time = '(' + obj.time + ')';
            } else {
                obj.time = '';
                obj.timeString = 'X';
            }
        }
    }
})();