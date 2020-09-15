<template>
  <div ref="gridItem" class="vue-grid-item" :class="classObj" :style="style">
    <slot></slot>
    <span
      v-if="resizableAndNotStatic"
      ref="handle"
      :class="resizableHandleClass"
    ></span>
    <!--<span v-if="draggable" ref="dragHandle" class="vue-draggable-handle"></span>-->
  </div>
</template>
<script>
  import {
    setTopLeft,
    setTopRight,
    setTransformRtl,
    setTransform,
  } from '../helpers/utils';
  import {
    getControlPosition,
    createCoreData,
  } from '../helpers/draggableUtils';
  import { getDocumentDir } from '../helpers/DOM';
  //    var eventBus = require('./eventBus');

  let interact = require('interactjs');

  export default {
    name: 'GridItem',
    props: {
      /*cols: {
             type: Number,
             required: true
             },*/
      /*containerWidth: {
             type: Number,
             required: true

             },
             rowHeight: {
             type: Number,
             required: true
             },
             margin: {
             type: Array,
             required: true
             },
             maxRows: {
             type: Number,
             required: true
             },*/
      isDraggable: {
        type: Boolean,
        required: false,
        default: null,
      },
      isResizable: {
        type: Boolean,
        required: false,
        default: null,
      },
      /*useCssTransforms: {
             type: Boolean,
             required: true
             },
             */
      static: {
        type: Boolean,
        required: false,
        default: false,
      },
      minH: {
        type: Number,
        required: false,
        default: 1,
      },
      minW: {
        type: Number,
        required: false,
        default: 1,
      },
      maxH: {
        type: Number,
        required: false,
        default: Infinity,
      },
      maxW: {
        type: Number,
        required: false,
        default: Infinity,
      },
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
      w: {
        type: Number,
        required: true,
      },
      h: {
        type: Number,
        required: true,
      },
      i: {
        type: [String, Number],
        required: true,
        default: null,
      },
      dragIgnoreFrom: {
        type: String,
        required: false,
        default: 'a, button',
      },
      dragAllowFrom: {
        type: String,
        required: false,
        default: null,
      },
      resizeIgnoreFrom: {
        type: String,
        required: false,
        default: 'a, button',
      },
    },
    inject: ['eventBus'],
    data() {
      return {
        cols: 1,
        containerWidth: 100,
        rowHeight: 30,
        margin: [10, 10],
        maxRows: Infinity,
        draggable: null,
        resizable: null,
        useCssTransforms: true,

        isDragging: false,
        dragging: null,
        isResizing: false,
        resizing: null,
        lastX: NaN,
        lastY: NaN,
        lastW: NaN,
        lastH: NaN,
        style: {},
        rtl: false,

        dragEventSet: false,
        resizeEventSet: false,

        previousW: null,
        previousH: null,
        previousX: null,
        previousY: null,
        innerX: this.x,
        innerY: this.y,
        innerW: this.w,
        innerH: this.h,
      };
    },
    computed: {
      classObj() {
        return {
          'vue-resizable': this.resizableAndNotStatic,
          static: this.static,
          resizing: this.isResizing,
          'vue-draggable-dragging': this.isDragging,
          cssTransforms: this.useCssTransforms,
          'render-rtl': this.renderRtl,
          'disable-userselect': this.isDragging,
          'no-touch': this.isAndroid && this.draggableOrResizableAndNotStatic,
        };
      },
      resizableAndNotStatic() {
        return this.resizable && !this.static;
      },
      draggableOrResizableAndNotStatic() {
        return (this.draggable || this.resizable) && !this.static;
      },
      isAndroid() {
        return navigator.userAgent.toLowerCase().indexOf('android') !== -1;
      },
      renderRtl() {
        return this.$parent.isMirrored ? !this.rtl : this.rtl;
      },
      resizableHandleClass() {
        if (this.renderRtl) {
          return 'vue-resizable-handle vue-rtl-resizable-handle';
        } else {
          return 'vue-resizable-handle';
        }
      },
    },
    watch: {
      isDraggable() {
        this.draggable = this.isDraggable;
      },
      static() {
        this.tryMakeDraggable();
        this.tryMakeResizable();
      },
      draggable() {
        this.tryMakeDraggable();
      },
      isResizable() {
        this.resizable = this.isResizable;
      },
      resizable() {
        this.tryMakeResizable();
      },
      rowHeight() {
        this.createStyle();
        this.emitContainerResized();
      },
      cols() {
        this.tryMakeResizable();
        this.createStyle();
        this.emitContainerResized();
      },
      containerWidth() {
        this.tryMakeResizable();
        this.createStyle();
        this.emitContainerResized();
      },
      x(newVal) {
        this.innerX = newVal;
        this.createStyle();
      },
      y(newVal) {
        this.innerY = newVal;
        this.createStyle();
      },
      h(newVal) {
        this.innerH = newVal;
        this.createStyle();
        // this.emitContainerResized();
      },
      w(newVal) {
        this.innerW = newVal;
        this.createStyle();
        // this.emitContainerResized();
      },
      renderRtl() {
        // console.log("### renderRtl");
        this.tryMakeResizable();
        this.createStyle();
      },
      minH() {
        this.tryMakeResizable();
      },
      maxH() {
        this.tryMakeResizable();
      },
      minW() {
        this.tryMakeResizable();
      },
      maxW() {
        this.tryMakeResizable();
      },
      '$parent.margin'(margin) {
        const t = this;
        if (!margin || (margin[0] == t.margin[0] && margin[1] == t.margin[1])) {
          return;
        }
        t.margin = margin.map((m) => Number(m));
        t.createStyle();
        t.emitContainerResized();
      },
    },
    created() {
      const t = this;
      // Accessible references of functions for removing in beforeDestroy
      t.updateWidthHandler = (width) => {
        t.updateWidth(width);
      };
      t.compactHandler = (layout) => {
        t.compact(layout);
      };
      t.setDraggableHandler = (isDraggable) => {
        if (t.isDraggable === null) {
          t.draggable = isDraggable;
        }
      };
      t.setResizableHandler = (isResizable) => {
        if (t.isResizable === null) {
          t.resizable = isResizable;
        }
      };
      t.setRowHeightHandler = (rowHeight) => {
        t.rowHeight = rowHeight;
      };
      t.setMaxRowsHandler = (maxRows) => {
        t.maxRows = maxRows;
      };
      t.directionchangeHandler = () => {
        t.rtl = getDocumentDir() === 'rtl';
        t.compact();
      };
      t.setColNum = (colNum) => {
        t.cols = parseInt(colNum);
      };
      t.eventBus.$on('updateWidth', t.updateWidthHandler);
      t.eventBus.$on('compact', t.compactHandler);
      t.eventBus.$on('setDraggable', t.setDraggableHandler);
      t.eventBus.$on('setResizable', t.setResizableHandler);
      t.eventBus.$on('setRowHeight', t.setRowHeightHandler);
      t.eventBus.$on('setMaxRows', t.setMaxRowsHandler);
      t.eventBus.$on('directionchange', t.directionchangeHandler);
      t.eventBus.$on('setColNum', t.setColNum);
      t.rtl = getDocumentDir() === 'rtl';
    },
    beforeDestroy() {
      const t = this;
      //Remove listeners
      t.eventBus.$off('updateWidth', t.updateWidthHandler);
      t.eventBus.$off('compact', t.compactHandler);
      t.eventBus.$off('setDraggable', t.setDraggableHandler);
      t.eventBus.$off('setResizable', t.setResizableHandler);
      t.eventBus.$off('setRowHeight', t.setRowHeightHandler);
      t.eventBus.$off('setMaxRows', t.setMaxRowsHandler);
      t.eventBus.$off('directionchange', t.directionchangeHandler);
      t.eventBus.$off('setColNum', t.setColNum);
      if (t.interactObj) {
        t.interactObj.unset(); // destroy interact intance
      }
    },
    mounted() {
      const t = this;
      t.cols = t.$parent.colNum;
      t.rowHeight = t.$parent.rowHeight;
      t.containerWidth = t.$parent.width !== null ? t.$parent.width : 100;
      t.margin = t.$parent.margin !== undefined ? t.$parent.margin : [10, 10];
      t.maxRows = t.$parent.maxRows;
      if (t.isDraggable === null) {
        t.draggable = t.$parent.isDraggable;
      } else {
        t.draggable = t.isDraggable;
      }
      if (t.isResizable === null) {
        t.resizable = t.$parent.isResizable;
      } else {
        t.resizable = t.isResizable;
      }
      t.useCssTransforms = t.$parent.useCssTransforms;
      t.createStyle();
    },
    methods: {
      createStyle() {
        const t = this;
        if (t.x + t.w > t.cols) {
          t.innerX = 0;
          t.innerW = t.w > t.cols ? t.cols : t.w;
        } else {
          t.innerX = t.x;
          t.innerW = t.w;
        }
        let pos = t.calcPosition(t.innerX, t.innerY, t.innerW, t.innerH);

        if (t.isDragging) {
          pos.top = t.dragging.top;
          //                    Add rtl support
          if (t.renderRtl) {
            pos.right = t.dragging.left;
          } else {
            pos.left = t.dragging.left;
          }
        }
        if (t.isResizing) {
          pos.width = t.resizing.width;
          pos.height = t.resizing.height;
        }

        let style;
        // CSS Transforms support (default)
        if (t.useCssTransforms) {
          //                    Add rtl support
          if (t.renderRtl) {
            style = setTransformRtl(pos.top, pos.right, pos.width, pos.height);
          } else {
            style = setTransform(pos.top, pos.left, pos.width, pos.height);
          }
        } else {
          // top,left (slow)
          //                    Add rtl support
          if (t.renderRtl) {
            style = setTopRight(pos.top, pos.right, pos.width, pos.height);
          } else {
            style = setTopLeft(pos.top, pos.left, pos.width, pos.height);
          }
        }
        t.style = style;
      },
      emitContainerResized() {
        const t = this;
        // this.style has width and height with trailing 'px'. The
        // resized event is without them
        let styleProps = {};
        for (let prop of ['width', 'height']) {
          let val = t.style[prop];
          let matches = val.match(/^(\d+)px$/);
          if (!matches) return;
          styleProps[prop] = matches[1];
        }
        t.$emit(
          'container-resized',
          t.i,
          t.h,
          t.w,
          styleProps.height,
          styleProps.width,
        );
      },
      handleResize(event) {
        const t = this;
        if (t.static) return;
        const position = getControlPosition(event);
        // Get the current drag point from the event. t is used as the offset.
        if (position == null) return; // not possible but satisfies flow
        const { x, y } = position;

        const newSize = { width: 0, height: 0 };
        let pos;
        switch (event.type) {
          case 'resizestart': {
            t.previousW = t.innerW;
            t.previousH = t.innerH;
            pos = t.calcPosition(t.innerX, t.innerY, t.innerW, t.innerH);
            newSize.width = pos.width;
            newSize.height = pos.height;
            t.resizing = newSize;
            t.isResizing = true;
            break;
          }
          case 'resizemove': {
            //                        console.log("### resize => " + event.type + ", lastW=" + t.lastW + ", lastH=" + t.lastH);
            const coreEvent = createCoreData(t.lastW, t.lastH, x, y);
            if (t.renderRtl) {
              newSize.width = t.resizing.width - coreEvent.deltaX;
            } else {
              newSize.width = t.resizing.width + coreEvent.deltaX;
            }
            newSize.height = t.resizing.height + coreEvent.deltaY;

            ///console.log("### resize => " + event.type + ", deltaX=" + coreEvent.deltaX + ", deltaY=" + coreEvent.deltaY);
            t.resizing = newSize;
            break;
          }
          case 'resizeend': {
            //console.log("### resize end => x=" +t.innerX + " y=" + t.innerY + " w=" + t.innerW + " h=" + t.innerH);
            pos = t.calcPosition(t.innerX, t.innerY, t.innerW, t.innerH);
            newSize.width = pos.width;
            newSize.height = pos.height;
            //                        console.log("### resize end => " + JSON.stringify(newSize));
            t.resizing = null;
            t.isResizing = false;
            break;
          }
        }

        // Get new WH
        pos = t.calcWH(newSize.height, newSize.width);
        if (pos.w < t.minW) {
          pos.w = t.minW;
        }
        if (pos.w > t.maxW) {
          pos.w = t.maxW;
        }
        if (pos.h < t.minH) {
          pos.h = t.minH;
        }
        if (pos.h > t.maxH) {
          pos.h = t.maxH;
        }

        if (pos.h < 1) {
          pos.h = 1;
        }
        if (pos.w < 1) {
          pos.w = 1;
        }

        t.lastW = x;
        t.lastH = y;

        if (t.innerW !== pos.w || t.innerH !== pos.h) {
          t.$emit('resize', t.i, pos.h, pos.w, newSize.height, newSize.width);
        }
        if (
          event.type === 'resizeend' &&
          (t.previousW !== t.innerW || t.previousH !== t.innerH)
        ) {
          t.$emit('resized', t.i, pos.h, pos.w, newSize.height, newSize.width);
        }
        t.eventBus.$emit(
          'resizeEvent',
          event.type,
          t.i,
          t.innerX,
          t.innerY,
          pos.h,
          pos.w,
        );
      },
      handleDrag(event) {
        const t = this;
        if (t.static) return;
        if (t.isResizing) return;

        const position = getControlPosition(event);

        // Get the current drag point from the event. This is used as the offset.
        if (position === null) return; // not possible but satisfies flow
        const { x, y } = position;

        // let shouldUpdate = false;
        let newPosition = { top: 0, left: 0 };
        switch (event.type) {
          case 'dragstart': {
            t.previousX = t.innerX;
            t.previousY = t.innerY;

            let parentRect = event.target.offsetParent.getBoundingClientRect();
            let clientRect = event.target.getBoundingClientRect();
            if (t.renderRtl) {
              newPosition.left = (clientRect.right - parentRect.right) * -1;
            } else {
              newPosition.left = clientRect.left - parentRect.left;
            }
            newPosition.top = clientRect.top - parentRect.top;
            t.dragging = newPosition;
            t.isDragging = true;
            break;
          }
          case 'dragend': {
            if (!t.isDragging) return;
            let parentRect = event.target.offsetParent.getBoundingClientRect();
            let clientRect = event.target.getBoundingClientRect();
            //                        Add rtl support
            if (t.renderRtl) {
              newPosition.left = (clientRect.right - parentRect.right) * -1;
            } else {
              newPosition.left = clientRect.left - parentRect.left;
            }
            newPosition.top = clientRect.top - parentRect.top;
            //                        console.log("### drag end => " + JSON.stringify(newPosition));
            //                        console.log("### DROP: " + JSON.stringify(newPosition));
            t.dragging = null;
            t.isDragging = false;
            // shouldUpdate = true;
            break;
          }
          case 'dragmove': {
            const coreEvent = createCoreData(t.lastX, t.lastY, x, y);
            //                        Add rtl support
            if (t.renderRtl) {
              newPosition.left = t.dragging.left - coreEvent.deltaX;
            } else {
              newPosition.left = t.dragging.left + coreEvent.deltaX;
            }
            newPosition.top = t.dragging.top + coreEvent.deltaY;
            //                        console.log("### drag => " + event.type + ", x=" + x + ", y=" + y);
            //                        console.log("### drag => " + event.type + ", deltaX=" + coreEvent.deltaX + ", deltaY=" + coreEvent.deltaY);
            //                        console.log("### drag end => " + JSON.stringify(newPosition));
            t.dragging = newPosition;
            break;
          }
        }

        // Get new XY
        let pos;
        if (t.renderRtl) {
          pos = t.calcXY(newPosition.top, newPosition.left);
        } else {
          pos = t.calcXY(newPosition.top, newPosition.left);
        }

        t.lastX = x;
        t.lastY = y;

        if (t.innerX !== pos.x || t.innerY !== pos.y) {
          t.$emit('move', t.i, pos.x, pos.y);
        }
        if (
          event.type === 'dragend' &&
          (t.previousX !== t.innerX || t.previousY !== t.innerY)
        ) {
          t.$emit('moved', t.i, pos.x, pos.y);
        }
        t.eventBus.$emit(
          'dragEvent',
          event.type,
          t.i,
          pos.x,
          pos.y,
          t.innerH,
          t.innerW,
        );
      },
      calcPosition(x, y, w, h) {
        const t = this;
        const colWidth = t.calcColWidth();
        // add rtl support
        let out;
        if (t.renderRtl) {
          out = {
            right: Math.round(colWidth * x + (x + 1) * t.margin[0]),
            top: Math.round(t.rowHeight * y + (y + 1) * t.margin[1]),
            // 0 * Infinity === NaN, which causes problems with resize constriants;
            // Fix t if it occurs.
            // Note we do it here rather than later because Math.round(Infinity) causes deopt
            width:
              w === Infinity
                ? w
                : Math.round(colWidth * w + Math.max(0, w - 1) * t.margin[0]),
            height:
              h === Infinity
                ? h
                : Math.round(
                    t.rowHeight * h + Math.max(0, h - 1) * t.margin[1],
                  ),
          };
        } else {
          out = {
            left: Math.round(colWidth * x + (x + 1) * t.margin[0]),
            top: Math.round(t.rowHeight * y + (y + 1) * t.margin[1]),
            // 0 * Infinity === NaN, which causes problems with resize constriants;
            // Fix this if it occurs.
            // Note we do it here rather than later because Math.round(Infinity) causes deopt
            width:
              w === Infinity
                ? w
                : Math.round(colWidth * w + Math.max(0, w - 1) * t.margin[0]),
            height:
              h === Infinity
                ? h
                : Math.round(
                    t.rowHeight * h + Math.max(0, h - 1) * t.margin[1],
                  ),
          };
        }

        return out;
      },
      /**
       * Translate x and y coordinates from pixels to grid units.
       * @param  {Number} top  Top position (relative to parent) in pixels.
       * @param  {Number} left Left position (relative to parent) in pixels.
       * @return {Object} x and y in grid units.
       */
      // TODO check if this function needs change in order to support rtl.
      calcXY(top, left) {
        const t = this;
        const colWidth = t.calcColWidth();

        // left = colWidth * x + margin * (x + 1)
        // l = cx + m(x+1)
        // l = cx + mx + m
        // l - m = cx + mx
        // l - m = x(c + m)
        // (l - m) / (c + m) = x
        // x = (left - margin) / (coldWidth + margin)
        let x = Math.round((left - t.margin[0]) / (colWidth + t.margin[0]));
        let y = Math.round((top - t.margin[1]) / (t.rowHeight + t.margin[1]));

        // Capping
        x = Math.max(Math.min(x, t.cols - t.innerW), 0);
        y = Math.max(Math.min(y, t.maxRows - t.innerH), 0);

        return { x, y };
      },
      // Helper for generating column width
      calcColWidth() {
        const t = this;
        const colWidth =
          (t.containerWidth - t.margin[0] * (t.cols + 1)) / t.cols;
        // console.log("### COLS=" + this.cols + " COL WIDTH=" + colWidth + " MARGIN " + this.margin[0]);
        return colWidth;
      },

      /**
       * Given a height and width in pixel values, calculate grid units.
       * @param  {Number} height Height in pixels.
       * @param  {Number} width  Width in pixels.
       * @return {Object} w, h as grid units.
       */
      calcWH(height, width) {
        const t = this;
        const colWidth = t.calcColWidth();

        // width = colWidth * w - (margin * (w - 1))
        // ...
        // w = (width + margin) / (colWidth + margin)
        let w = Math.round((width + t.margin[0]) / (colWidth + t.margin[0]));
        let h = Math.round(
          (height + t.margin[1]) / (t.rowHeight + t.margin[1]),
        );

        // Capping
        w = Math.max(Math.min(w, t.cols - t.innerX), 0);
        h = Math.max(Math.min(h, t.maxRows - t.innerY), 0);
        return { w, h };
      },
      updateWidth(width, colNum) {
        const t = this;
        t.containerWidth = width;
        if (colNum !== undefined && colNum !== null) {
          t.cols = colNum;
        }
      },
      compact() {
        this.createStyle();
      },
      tryMakeDraggable() {
        const t = this;
        if (t.interactObj === null || t.interactObj === undefined) {
          t.interactObj = interact(t.$refs.gridItem);
        }
        if (t.draggable && !t.static) {
          const opts = {
            ignoreFrom: t.dragIgnoreFrom,
            allowFrom: t.dragAllowFrom,
          };
          t.interactObj.draggable(opts);
          /*t.interactObj.draggable({allowFrom: '.vue-draggable-handle'});*/
          if (!t.dragEventSet) {
            t.dragEventSet = true;
            t.interactObj.on('dragstart dragmove dragend', (event) => {
              t.handleDrag(event);
            });
          }
        } else {
          t.interactObj.draggable({
            enabled: false,
          });
        }
      },
      tryMakeResizable() {
        const t = this;
        if (t.interactObj === null || t.interactObj === undefined) {
          t.interactObj = interact(t.$refs.gridItem);
        }
        if (t.resizable && !t.static) {
          let maximum = t.calcPosition(0, 0, t.maxW, t.maxH);
          let minimum = t.calcPosition(0, 0, t.minW, t.minH);

          // console.log("### MAX " + JSON.stringify(maximum));
          // console.log("### MIN " + JSON.stringify(minimum));

          const opts = {
            preserveAspectRatio: true,
            // allowFrom: "." + t.resizableHandleClass,
            edges: {
              left: false,
              right: '.' + t.resizableHandleClass,
              bottom: '.' + t.resizableHandleClass,
              top: false,
            },
            ignoreFrom: t.resizeIgnoreFrom,
            restrictSize: {
              min: {
                height: minimum.height,
                width: minimum.width,
              },
              max: {
                height: maximum.height,
                width: maximum.width,
              },
            },
          };

          t.interactObj.resizable(opts);
          if (!t.resizeEventSet) {
            t.resizeEventSet = true;
            t.interactObj.on('resizestart resizemove resizeend', (event) => {
              t.handleResize(event);
            });
          }
        } else {
          t.interactObj.resizable({
            enabled: false,
          });
        }
      },
      autoSize() {
        const t = this;
        // ok here we want to calculate if a resize is needed
        t.previousW = t.innerW;
        t.previousH = t.innerH;

        let newSize = t.$slots.default[0].elm.getBoundingClientRect();
        let pos = t.calcWH(newSize.height, newSize.width);
        if (pos.w < t.minW) {
          pos.w = t.minW;
        }
        if (pos.w > t.maxW) {
          pos.w = t.maxW;
        }
        if (pos.h < t.minH) {
          pos.h = t.minH;
        }
        if (pos.h > t.maxH) {
          pos.h = t.maxH;
        }

        if (pos.h < 1) {
          pos.h = 1;
        }
        if (pos.w < 1) {
          pos.w = 1;
        }

        // t.lastW = x; // basically, t is copied from resizehandler, but shouldn't be needed
        // t.lastH = y;

        if (t.innerW !== pos.w || t.innerH !== pos.h) {
          t.$emit('resize', t.i, pos.h, pos.w, newSize.height, newSize.width);
        }
        if (t.previousW !== pos.w || t.previousH !== pos.h) {
          t.$emit('resized', t.i, pos.h, pos.w, newSize.height, newSize.width);
          t.eventBus.$emit(
            'resizeEvent',
            'resizeend',
            t.i,
            t.innerX,
            t.innerY,
            pos.h,
            pos.w,
          );
        }
      },
    },
  };
</script>
<style>
  .vue-grid-item {
    transition: all 200ms ease;
    transition-property: left, top, right;
    /* add right for rtl */
  }

  .vue-grid-item.no-touch {
    -ms-touch-action: none;
    touch-action: none;
  }

  .vue-grid-item.cssTransforms {
    transition-property: transform;
    left: 0;
    right: auto;
  }

  .vue-grid-item.cssTransforms.render-rtl {
    left: auto;
    right: 0;
  }

  .vue-grid-item.resizing {
    opacity: 0.6;
    z-index: 3;
  }

  .vue-grid-item.vue-draggable-dragging {
    transition: none;
    z-index: 3;
  }

  .vue-grid-item.vue-grid-placeholder {
    background: red;
    opacity: 0.2;
    transition-duration: 100ms;
    z-index: 2;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -o-user-select: none;
    user-select: none;
  }

  .vue-grid-item > .vue-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: 0;
    right: 0;
    background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');
    background-position: bottom right;
    padding: 0 3px 3px 0;
    background-repeat: no-repeat;
    background-origin: content-box;
    box-sizing: border-box;
    cursor: se-resize;
  }

  .vue-grid-item > .vue-rtl-resizable-handle {
    bottom: 0;
    left: 0;
    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAuMDAwMDAwMDAwMDAwMDAyIiBoZWlnaHQ9IjEwLjAwMDAwMDAwMDAwMDAwMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDwhLS0gQ3JlYXRlZCB3aXRoIE1ldGhvZCBEcmF3IC0gaHR0cDovL2dpdGh1Yi5jb20vZHVvcGl4ZWwvTWV0aG9kLURyYXcvIC0tPgogPGc+CiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPgogIDxyZWN0IGZpbGw9Im5vbmUiIGlkPSJjYW52YXNfYmFja2dyb3VuZCIgaGVpZ2h0PSIxMiIgd2lkdGg9IjEyIiB5PSItMSIgeD0iLTEiLz4KICA8ZyBkaXNwbGF5PSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgeT0iMCIgeD0iMCIgaGVpZ2h0PSIxMDAlIiB3aWR0aD0iMTAwJSIgaWQ9ImNhbnZhc0dyaWQiPgogICA8cmVjdCBmaWxsPSJ1cmwoI2dyaWRwYXR0ZXJuKSIgc3Ryb2tlLXdpZHRoPSIwIiB5PSIwIiB4PSIwIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+CiAgPC9nPgogPC9nPgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxsaW5lIGNhbnZhcz0iI2ZmZmZmZiIgY2FudmFzLW9wYWNpdHk9IjEiIHN0cm9rZS1saW5lY2FwPSJ1bmRlZmluZWQiIHN0cm9rZS1saW5lam9pbj0idW5kZWZpbmVkIiBpZD0ic3ZnXzEiIHkyPSItNzAuMTc4NDA3IiB4Mj0iMTI0LjQ2NDE3NSIgeTE9Ii0zOC4zOTI3MzciIHgxPSIxNDQuODIxMjg5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIi8+CiAgPGxpbmUgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z181IiB5Mj0iOS4xMDY5NTciIHgyPSIwLjk0NzI0NyIgeTE9Ii0wLjAxODEyOCIgeDE9IjAuOTQ3MjQ3IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICA8bGluZSBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z183IiB5Mj0iOSIgeDI9IjEwLjA3MzUyOSIgeTE9IjkiIHgxPSItMC42NTU2NCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiM2NjY2NjYiIGZpbGw9Im5vbmUiLz4KIDwvZz4KPC9zdmc+);
    background-position: bottom left;
    padding-left: 3px;
    background-repeat: no-repeat;
    background-origin: content-box;
    cursor: sw-resize;
    right: auto;
  }

  .vue-grid-item.disable-userselect {
    user-select: none;
  }
</style>
