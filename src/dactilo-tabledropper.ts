import angular = require("angular");
import {TableDraggerModule} from "./table-dragger/index";
import {IScope, ITimeoutService} from "angular";

export module DactiloTableDropperModule {
    interface TableDirectiveScope extends IScope {
        dtdModel: any;
        dtdDrop: any;
    }

    let TableDirective = function($timeout: ITimeoutService): angular.IDirective {
        return {
            transclude: false,
            scope: {
                dtdModel: '=',
                dtdDrop: '='
            },
            restrict: 'A',
            link: function(scope: TableDirectiveScope,
                           element: any) {
                let dragger = null;
                let enableTableDragger = function() {
                    if(dragger != null) {
                        dragger.destroy();
                    }
                    dragger = TableDraggerModule.tableDragger(element[0], {
                        mode: "free",
                        onlyBody: true,
                        fixFirstColumn: true,
                        dragHandler: '.handle'
                    }).on('drop', (oldIndex, newIndex, el, mode) => {
                        if(mode == "row") {
                            arrayMove(scope.dtdModel.lines, oldIndex - 1, newIndex - 1);
                            scope.$apply();
                        }

                        if(mode == "column") {
                            arrayMove(scope.dtdModel.header.cells, oldIndex - 1, newIndex - 1);

                            scope.dtdModel.lines.forEach(line => {
                                arrayMove(line.cells, oldIndex - 1, newIndex - 1);
                            });
                            scope.$apply();
                        }

                        if(scope.dtdDrop) {
                            scope.dtdDrop(oldIndex, newIndex, mode);
                        }
                    });
                };

                let arrayMove = function(arr, fromIndex, toIndex) {
                    let element = arr[fromIndex];
                    arr.splice(fromIndex, 1);
                    arr.splice(toIndex, 0, element);
                };

                $timeout(function () {
                    enableTableDragger();
                });

                scope.$watch('dtdModel', function () {
                    enableTableDragger();
                }, true);
            }
        }
    };

    export let angularModule = angular.module('dactilo-tabledropper', [])
        .directive('dtdTable', ["$timeout", TableDirective]);
}