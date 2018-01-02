import angular = require("angular");
import {TableDraggerModule} from "./table-dragger/index";

export module DactiloTableDropperModule {
    let TableDirective = function (): angular.IDirective {
        return {
            transclude: false,
            scope: {},
            restrict: 'A',
            link: function(scope: angular.IScope,
                           element: any) {
                TableDraggerModule.tableDragger(element[0], {
                    mode: "free",
                    onlyBody: true,
                    dragHandler: '.handle'
                }).on('shadowMove', (oldIndex, newIndex, el, mode) => {
                    console.log('shadowMove');
                    console.log(newIndex);
                });
            }
        }
    };

    export let angularModule = angular.module('dactilo-tabledropper', [])
        .directive('dtdTable', [TableDirective]);
}