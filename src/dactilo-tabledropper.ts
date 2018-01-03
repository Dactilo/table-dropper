import angular = require("angular");
import {TableDraggerModule} from "./table-dragger/index";
import {IScope, ITimeoutService} from "angular";

export module DactiloTableDropperModule {
    interface TableDirectiveScope extends IScope {
        dtdModel: any;
    }

    let TableDirective = function($timeout: ITimeoutService): angular.IDirective {
        return {
            transclude: false,
            scope: {
                dtdModel: '='
            },
            restrict: 'A',
            link: function(scope: TableDirectiveScope,
                           element: any) {
                let arrayMove = function(arr, fromIndex, toIndex) {
                    let element = arr[fromIndex];
                    arr.splice(fromIndex, 1);
                    arr.splice(toIndex, 0, element);
                };

                $timeout(function () {
                    TableDraggerModule.tableDragger(element[0], {
                        mode: "free",
                        onlyBody: true,
                        dragHandler: '.handle'
                    }).on('drop', (oldIndex, newIndex, el, mode) => {
                        if(mode == "row") {
                            arrayMove(scope.dtdModel.lines, oldIndex - 1, newIndex - 1);
                            scope.$apply();
                        }

                        if(mode == "column") {
                            arrayMove(scope.dtdModel.header, oldIndex, newIndex );

                            scope.dtdModel.lines.forEach(line => {
                                arrayMove(line, oldIndex, newIndex);
                            });
                            scope.$apply();
                        }
                    });
                });

            }
        }
    };

    export let angularModule = angular.module('dactilo-tabledropper', [])
        .directive('dtdTable', ["$timeout", TableDirective]);
}