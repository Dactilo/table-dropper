import Dragger from './draggable-list';
import classes from './classes';
import {touchy, sort} from './util';
import arrayFrom = require('array.from');

export default class Drag {
    constructor(table = null, userOptions = {}) {
        if (!checkIsTable(table)) {
            throw new TypeError(`table-dragger: el must be TABLE HTMLElement, not ${{}.toString.call(table)}`);
        }
        if (!table.rows.length) {
            return;
        }

        const defaults = {
            mode: 'column',
            dragHandler: '',
            onlyBody: false,
            animation: 300,
        };
        const options = (this as any).options = (Object as any).assign({}, defaults, userOptions);
        const {mode} = options;
        if (mode === 'free' && !options.dragHandler) {
            throw new Error('table-dragger: please specify dragHandler in free mode');
        }

        ['onTap', 'destroy', 'startBecauseMouseMoved', 'sortColumn', 'sortRow'].forEach((m) => {
            this[m] = this[m].bind(this);
        });

        const dragger = (this as any).dragger = emitter({
            dragging: false,
            destroy: this.destroy,
        });

        (dragger as any).on('drop', (from, to, originEl, realMode) => {
            (realMode === 'column' ? this.sortColumn : this.sortRow)(from, to);
        });

        let handlers;
        if (options.dragHandler) {
            handlers = table.querySelectorAll(options.dragHandler);
            if (handlers && !handlers.length) {
                throw new Error('table-dragger: no element match dragHandler selector');
            }
        } else {
            handlers = mode === 'column' ? (table.rows[0] ? table.rows[0].children : []) : arrayFrom(table.rows).map(row => row.children[0]);
        }
        (this as any).handlers = arrayFrom(handlers);
        (this as any).handlers.forEach((h) => {
            h.classList.add(classes.handle);
        });

        table.classList.add(classes.originTable);

        (this as any).tappedCoord = {x: 0, y: 0}; // the coord of mouseEvent user clicked
        (this as any).cellIndex = {x: 0, y: 0}; // the cell's index of row and column
        (this as any).el = table;
        this.bindEvents();
    }

    bindEvents() {
        for (const e of (this as any).handlers) {
            touchy(e, 'add', 'mousedown', this.onTap);
        }
    }

    onTap(event) {
        let {target} = event;
        while (target.nodeName !== 'TD' && target.nodeName !== 'TH') {
            target = target.parentElement;
        }

        const ignore = !isLeftButton(event) || event.metaKey || event.ctrlKey;
        if (ignore) {
            return;
        }

        (this as any).cellIndex = {x: target.cellIndex, y: target.parentElement.rowIndex};
        (this as any).tappedCoord = {x: event.clientX, y: event.clientY};

        this.eventualStart(false);
        touchy(document, 'add', 'mouseup', () => {
            this.eventualStart(true);
        });
    }

    startBecauseMouseMoved(event) {
        const {tappedCoord, options: {mode}} = (this as any);
        const gapX = Math.abs(event.clientX - tappedCoord.x);
        const gapY = Math.abs(event.clientY - tappedCoord.y);
        const isFree = mode === 'free';
        let realMode = mode;

        if (gapX === 0 && gapY === 0) {
            return;
        }

        if (isFree) {
            realMode = gapX < gapY ? 'row' : 'column';
        }

        const sortTable = new Dragger({
            mode: realMode,
            originTable: this,
        });
        this.eventualStart(true);
        // this listener will be removed after user start dragging
        touchy(document, 'add', 'mouseup', sortTable.destroy);
    }

    eventualStart(remove) {
        const op = remove ? 'remove' : 'add';
        touchy(document, op, 'mousemove', this.startBecauseMouseMoved);
    }

    destroy() {
        for (const h of (this as any).handlers) {
            touchy(h, 'remove', 'mousedown', this.onTap);
        }
        (this as any).el.classList.remove(classes.originTable);
    }

    sortColumn(from, to) {
        if (from === to) {
            return;
        }
        const table = (this as any).el;
        arrayFrom(table.rows).forEach((row) => {
            sort({list: row.children, from, to});
        });

        const cols = table.querySelectorAll('col');
        if (cols.length) {
            sort({list: cols, from, to});
        }
    }

    sortRow(from, to) {
        if (from === to) {
            return;
        }
        const table = (this as any).el;
        const list = arrayFrom(table.rows);
        sort({list, parent: list[to].parentElement, from, to});
    }

    static create(el, options) {
        const d = new Drag(el, options) as any;
        return d && d.dragger;
    }

    static version = '1.0';
}

function checkIsTable(ele) {
    return ele
        &&
        typeof ele === 'object'
        &&
        'nodeType' in ele
        &&
        ele.nodeType === 1
        &&
        ele.cloneNode
        &&
        ele.nodeName === 'TABLE';
}

function isLeftButton(e) {
    if ('touches' in e) {
        return e.touches.length === 1;
    }
    if ('buttons' in e) {
        return e.buttons === 1;
    }
    if ('button' in e) {
        return e.button === 0;
    }
    return false;
}

function emitter(thing = {}) {
    /* eslint-disable no-param-reassign */
    const evt = {};
    (thing as any).on = (type, fn) => {
        evt[type] = evt[type] || [];
        evt[type].push(fn);
        return thing;
    };
    (thing as any).emit = (type, ...args) => {
        if (!evt[type]) {
            return;
        }
        for (const fn of evt[type]) {
            fn(...args);
        }
    };
    return thing;
}
