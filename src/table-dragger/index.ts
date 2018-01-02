import './main.css';
import Drag from './drag';

export module TableDraggerModule {
    export let tableDragger = function(el: any, options: any): any {
        return Drag.create(el, options);
    }
}