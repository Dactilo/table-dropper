import dragula = require('dragula-with-animation');
import arrayFrom = require('array.from');

import classes from './classes';

import {
    insertBeforeSibling,
    getScrollBarWidth,
    css,
    remove,
    getLongestRow,
    empty,
    touchy,
    getTouchyEvent,
} from './util';

// const isTest = true;
const isTest = false;
let bodyPaddingRight;
let bodyOverflow;
export default class Dragger {
    constructor({originTable, mode}) {
        const {dragger, cellIndex, el: originEl, options} = originTable as any;
        const fakeTables = (this as any).fakeTables = buildTables(originEl, mode);

        bodyPaddingRight = parseInt(document.body.style.paddingRight, 0) || 0;
        bodyOverflow = document.body.style.overflow;

        (this as any).options = options;
        (this as any).mode = mode;
        (this as any).originTable = originTable;
        (this as any).dragger = dragger;
        (this as any).index = mode === 'column' ? cellIndex.x : cellIndex.y;
        ['destroy', 'onDrag', 'onDragend', 'onShadow', 'onOut'].forEach((m) => {
            this[m] = this[m].bind(this);
        });

        // pointfree?
        (this as any).el = fakeTables.reduce((previous, current) => {
            const li = document.createElement('li');
            li.appendChild(current);
            return previous.appendChild(li) && previous;
        }, document.createElement('ul'));

        (this as any).drake = dragula([(this as any).el], {
            animation: 300,
            staticClass: classes.staticTable,
            direction: mode === 'column' ? 'horizontal' : 'vertical',
        })
            .on('drag', this.onDrag)
            .on('dragend', this.onDragend)
            .on('shadow', this.onShadow)
            .on('out', this.onOut);

        this.renderEl();
        this.dispatchMousedown();
    }

    onDrag() {
        css(document.body, {overflow: 'hidden'});
        const barWidth = getScrollBarWidth();
        (this as any).dragger.dragging = true;
        if (barWidth) {
            css(document.body, {'padding-right': `${barWidth + bodyPaddingRight}px`});
        }
        touchy(document, 'remove', 'mouseup', this.destroy);
        (this as any).dragger.emit('drag', (this as any).originTable.el, (this as any).options.mode);
    }

    onDragend(droppedItem) {
        const {originTable: {el: originEl}, dragger, index, mode, el} = (this as any);
        css(document.body, {overflow: bodyOverflow, 'padding-right': `${bodyPaddingRight}px`});
        (this as any).dragger.dragging = false;
        const from = index;
        const to = arrayFrom(el.children).indexOf(droppedItem);
        this.destroy();
        dragger.emit('drop', from, to, originEl, mode);
    }

    onShadow(draggingItem) {
        const {originTable: {el: originEl}, dragger, index, el, mode} = (this as any);
        const from = index;
        const to = arrayFrom(el.children).indexOf(draggingItem);
        dragger.emit('shadowMove', from, to, originEl, mode);
    }

    onOut() {
        (this as any).dragger.dragging = false;
        (this as any).dragger.emit('out', (this as any).originTable.el, (this as any).mode);
    }

    destroy() {
        remove(document, 'mouseup', this.destroy);
        (this as any).el.parentElement.classList.remove(classes.dragging);
        if (!isTest) {
            (this as any).el.parentElement.removeChild((this as any).el);
        }
        setTimeout(() => {
            (this as any).drake.destroy();
        }, 0);
    }

    dispatchMousedown() {
        const {el, index} = (this as any);
        el.children[index].dispatchEvent(getTouchyEvent());
    }

    renderEl() {
        const {mode, el, originTable: {el: originEl}} = (this as any);
        // const rect = originEl.getBoundingClientRect();

        (this as any).sizeFakes();
        css(el, {
            // position: 'fixed',
            // top: `${rect.top}px`,
            // left: `${rect.left}px`,
            position: 'absolute',
            top: `${originEl.offsetTop}px`,
            left: `${originEl.offsetLeft}px`,
        });
        insertBeforeSibling({target: el, origin: originEl});

        // render every wrapper of table(element li)
        const s = window.getComputedStyle(originEl).getPropertyValue('border-spacing').split(' ')[0];
        const attr = mode === 'column' ? 'margin-right' : 'margin-bottom';
        const l = el.children.length;
        let i = 0;
        arrayFrom(el.children).forEach((li, dex) => {
            /* eslint-disable no-param-reassign*/
            const table = li && li.querySelector('table');
            if (
                    (this as any).options.onlyBody && mode === 'row' && !arrayFrom(table.children).some(o => o.nodeName === 'TBODY')
                        ||
                    (this as any).options.onlyBody && (this as any).options.fixFirstColumn && mode === 'column' && i == 0
                ) {
                li.classList.add(classes.staticTable);
            }

            if (s && dex < (l - 1)) {
                li.style[attr] = `-${s}`;
            }

            i++;
        });

        el.parentElement.classList.add(classes.dragging);
        el.classList.add(classes.draggableTable);
        el.classList.add(`sindu_${mode}`);
    }

    sizeFakes() {
        return (this as any).mode === 'column' ? this.sizeColumnFake() : this.sizeRowFake();
    }

    sizeColumnFake() {
        const {fakeTables, originTable: {el: originEl}} = this as any;
        // calculate width of every column
        arrayFrom(getLongestRow(originEl).children).forEach(
            (cell, index) => {
                const w = cell.getBoundingClientRect().width;
                const t = fakeTables[index];
                css(t, {width: `${w}px`});
                css(t.rows[0].children[0], {width: `${w}px`});
            }
        );
        // calculate height of every cell
        const rowHeights = arrayFrom(originEl.rows)
            .map(row => row.children[0].getBoundingClientRect().height);
        fakeTables.forEach((t) => {
            /* eslint-disable no-param-reassign*/
            arrayFrom(t.rows).forEach((row, index) => {
                css(row, {height: `${rowHeights[index]}px`});
            });
        });
    }

    sizeRowFake() {
        const {fakeTables, originTable: {el: originEl}} = this as any;

        const cells = getLongestRow(originEl).children;
        const w = originEl.getBoundingClientRect().width;
        // 行排列时计算每一行各个cell宽度
        /* eslint-disable no-param-reassign*/
        fakeTables.forEach((t) => {
            css(t, {width: `${w}px`});
            arrayFrom(t.rows[0].children).forEach((cell, i) => {
                css(cell, {width: `${cells[i].getBoundingClientRect().width}px`});
            });
        });
        // fakeTables.forEach((table, index) => {
        //   /* eslint-disable no-param-reassign*/
        //   table.style.height = `${originEl.rows[index].getBoundingClientRect().height}px`;
        // });
    }
}

// input:clone(originTable)
function origin2DragItem(liTable) {
    css(liTable, {'table-layout': 'fixed', width: 'initial', height: 'initial', padding: 0, margin: 0});
    ['width', 'height', 'id'].forEach((p) => {
        liTable.removeAttribute(p);
    });
    liTable.classList.remove((classes as any).originTable);
    arrayFrom(liTable.querySelectorAll('col')).forEach((col) => {
        col.removeAttribute('width');
        css(col, {width: 'initial'});
    });
}

function getColumnAsTableByIndex(table, index) {
    const cTable = table.cloneNode(true);
    origin2DragItem(cTable);

    const cols = cTable.querySelectorAll('col');
    if (cols.length) {
        arrayFrom(cols).forEach((col, dex) => {
            if (dex !== index) {
                col.parentElement.removeChild(col);
            }
        });
    }

    arrayFrom(cTable.rows).forEach((row) => {
        const target = row.children[index];
        empty(row);
        if (target) {
            row.appendChild(target);
        }
    });
    return cTable;
}

function buildRowTables(table) {
    return arrayFrom(table.rows).map((row) => {
        const cTable = table.cloneNode(true);

        origin2DragItem(cTable);

        arrayFrom(cTable.children).forEach((c) => {
            const {nodeName} = c;
            if (nodeName !== 'COL' && nodeName !== 'COLGROUP') {
                cTable.removeChild(c);
            }
        });

        const organ = row.parentElement.cloneNode();
        organ.innerHTML = '';
        organ.appendChild(row.cloneNode(true));
        cTable.appendChild(organ);
        return cTable;
    });
}

function buildColumnTables(table) {
    return arrayFrom(getLongestRow(table).children).map((cell, index) =>
        getColumnAsTableByIndex(table, index));
}

function buildTables(table, mode) {
    return mode === 'column' ? buildColumnTables(table) : buildRowTables(table);
}
