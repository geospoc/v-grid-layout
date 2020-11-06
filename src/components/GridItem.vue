<template>
  <div ref="gridItem" class="vue-grid-item" :class="classObj" :style="style">
    <div class="container">
      <div class="content flex">
        <!-- content can go here -->
      </div>
    </div>
    <span
      v-if="resizableAndNotStatic"
      ref="handle"
      :class="resizableHandleClass"
    ></span>
    <!--<span v-if="draggable" ref="dragHandle" class="vue-draggable-handle"></span>-->
  </div>
</template>
<script lang="ts">
  import {
    computed,
    defineComponent,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
  } from '@vue/composition-api';
  import {
    setTopLeft,
    setTopRight,
    setTransformRtl,
    setTransform,
    useEventBus,
  } from '../helpers/utils';
  import {
    getControlPosition,
    createCoreData,
  } from '../helpers/draggableUtils';
  import { getDocumentDir } from '../helpers/DOM';
  //    var eventBus = require('./eventBus');
  import interact from 'interactjs';
  //  interact = require('interactjs');
  export default defineComponent({
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
      tabs: {
        type: Array,
        required: false,
        default: () => [{ title: 'Tab1' }, { title: 'Tab2' }],
      },
    },
    setup(props, { root, parent, emit }: any) {
      const cols = ref(1);
      const containerWidth = ref(100);
      const rowHeight = ref(30);
      const margin = ref([10, 10]);
      const maxRows = ref(Infinity);
      const draggable = ref<boolean>(false);
      const resizable = ref<boolean>(false);
      const useCssTransforms = ref(true);

      const isDragging = ref(false);
      const dragging = ref<any>({});
      const isResizing = ref(false);
      let resizing = reactive<any>({});
      const lastX = ref(NaN);
      const lastY = ref(NaN);
      const lastW = ref(NaN);
      const lastH = ref(NaN);
      let style = ref({});
      const rtl = ref(false);
      const dragEventSet = ref(false);
      const resizeEventSet = ref(false);
      const previousW = ref<number>(0);
      const previousH = ref<number>(0);
      const previousX = ref<number>(0);
      const previousY = ref<number>(0);
      const innerX = ref(props.x);
      const innerY = ref(props.y);
      const innerW = ref(props.w);
      const innerH = ref(props.h);
      const gridItem = ref<any | null>(null);
      let activeTab = ref<number>(0);
      let interactObj: any | null = null;
      const eventBus: any = useEventBus();
      // computed properties
      let contentTab = computed(() => {
        return props.tabs.filter((tab, idx) => idx === activeTab.value);
      });
      const classObj = computed(() => {
        return {
          'vue-resizable': resizableAndNotStatic.value,
          static: props.static,
          resizing: isResizing.value,
          'vue-draggable-dragging': isDragging.value,
          cssTransforms: useCssTransforms.value,
          'render-rtl': renderRtl.value,
          'disable-userselect': isDragging.value,
          'no-touch': isAndroid.value && draggableOrResizableAndNotStatic.value,
        };
      });
      const resizableAndNotStatic = computed(() => {
        return resizable.value && !props.static;
      });
      const draggableOrResizableAndNotStatic = computed(() => {
        return (draggable.value || resizable.value) && !props.static;
      });
      const isAndroid = computed(() => {
        return navigator.userAgent.toLowerCase().indexOf('android') !== -1;
      });
      const renderRtl = computed(() => {
        return parent.isMirrored ? !rtl.value : rtl.value;
      });
      const resizableHandleClass = computed(() => {
        if (renderRtl.value) {
          return 'vue-resizable-handle vue-rtl-resizable-handle';
        } else {
          return 'vue-resizable-handle';
        }
      });
      // watchers
      // isDraggable
      watch(
        () => props.isDraggable,
        (newValue, oldValue) => {
          draggable.value = newValue;
        },
      );
      watch(
        () => props.static,
        (newValue, oldValue) => {
          tryMakeDraggable();
          tryMakeResizable();
        },
      );
      watch(
        () => draggable.value,
        (newValue, oldValue) => {
          tryMakeDraggable();
        },
      );
      watch(
        () => props.isResizable,
        (newValue, oldValue) => {
          resizable.value = newValue;
        },
      );
      watch(
        () => resizable.value,
        (newValue, oldValue) => {
          tryMakeResizable();
        },
      );
      watch(
        () => rowHeight.value,
        (newValue, oldValue) => {
          createStyle();
          emitContainerResized();
        },
      );
      watch(
        () => cols.value,
        (newValue, oldValue) => {
          tryMakeResizable();
          createStyle();
          emitContainerResized();
        },
      );
      watch(
        () => containerWidth.value,
        (newValue, oldValue) => {
          tryMakeResizable();
          createStyle();
          emitContainerResized();
        },
      );
      watch(
        () => props.x,
        (newValue, oldValue) => {
          innerX.value = newValue;
          createStyle();
        },
      );
      watch(
        () => props.y,
        (newValue, oldValue) => {
          innerY.value = newValue;
          createStyle();
        },
      );
      watch(
        () => props.h,
        (newValue, oldValue) => {
          innerH.value = newValue;
          createStyle();
        },
      );
      watch(
        () => props.w,
        (newValue, oldValue) => {
          innerW.value = newValue;
          createStyle();
        },
      );
      watch(
        () => renderRtl.value,
        (newValue, oldValue) => {
          tryMakeResizable();
          createStyle();
        },
      );
      watch(
        () => props.minH,
        (newValue, oldValue) => {
          tryMakeResizable();
        },
      );
      watch(
        () => props.maxH,
        (newValue, oldValue) => {
          tryMakeResizable();
        },
      );
      watch(
        () => props.minW,
        (newValue, oldValue) => {
          tryMakeResizable();
        },
      );
      watch(
        () => props.maxW,
        (newValue, oldValue) => {
          tryMakeResizable();
        },
      );
      watch(
        () => `parent.margin${margin.value}`,
        (newValue, oldValue) => {
          if (
            !margin ||
            (margin[0] == margin.value[0] && margin[1] == margin.value[1])
          ) {
            return;
          }
          margin.value = margin.value.map((m) => Number(m));
          createStyle();
          emitContainerResized();
        },
      );
      // created
      // Accessible references of functions for removing in beforeDestroy
      const updateWidthHandler = (width) => {
        updateWidth(width, null);
      };
      const compactHandler = (layout) => {
        compact();
      };
      const setDraggableHandler = (isDraggable) => {
        if (props.isDraggable === null) {
          draggable.value = isDraggable;
        }
      };
      const setResizableHandler = (isResizable) => {
        if (props.isResizable === null) {
          resizable.value = isResizable;
        }
      };
      const setRowHeightHandler = (rowHeight) => {
        rowHeight.value = rowHeight;
      };
      const setMaxRowsHandler = (maxRows) => {
        maxRows.value = maxRows;
      };
      const directionchangeHandler = () => {
        rtl.value = getDocumentDir() === 'rtl';
        compact();
      };
      const setColNum = (colNum) => {
        cols.value = parseInt(colNum);
      };
      eventBus.$on('update-width', updateWidthHandler);
      eventBus.$on('compact', compactHandler);
      eventBus.$on('setDraggable', setDraggableHandler);
      eventBus.$on('setResizable', setResizableHandler);
      eventBus.$on('setRowHeight', setRowHeightHandler);
      eventBus.$on('setMaxRows', setMaxRowsHandler);
      eventBus.$on('directionchange', directionchangeHandler);
      eventBus.$on('setColNum', setColNum);
      rtl.value = getDocumentDir() === 'rtl';
      // before unmount
      onBeforeUnmount(() => {
        //Remove listeners
        eventBus.$off('update-width', updateWidthHandler);
        eventBus.$off('compact', compactHandler);
        eventBus.$off('setDraggable', setDraggableHandler);
        eventBus.$off('setResizable', setResizableHandler);
        eventBus.$off('setRowHeight', setRowHeightHandler);
        eventBus.$off('setMaxRows', setMaxRowsHandler);
        eventBus.$off('directionchange', directionchangeHandler);
        eventBus.$off('setColNum', setColNum);
        if (interactObj) {
          interactObj.unset(); // destroy interact intance
        }
      });
      onMounted(() => {
        cols.value = parent.colNum;
        rowHeight.value = parent.rowHeight;
        containerWidth.value = parent.width !== null ? parent.width : 100;

        margin.value = parent.margin !== undefined ? parent.margin : [10, 10];
        maxRows.value = parent.maxRows;
        if (props.isDraggable === null) {
          draggable.value = parent.isDraggable;
        } else {
          draggable.value = props.isDraggable;
        }
        if (props.isResizable === null) {
          resizable.value = parent.isResizable;
        } else {
          resizable.value = props.isResizable;
        }
        useCssTransforms.value = parent.useCssTransforms;
        createStyle();
      });
      function createStyle() {
        if (props.x + props.w > cols.value) {
          innerX.value = 0;
          innerW.value = props.w > cols.value ? cols.value : props.w;
        } else {
          innerX.value = props.x;
          innerW.value = props.w;
        }
        let pos = calcPosition(
          innerX.value,
          innerY.value,
          innerW.value,
          innerH.value,
        );
        if (isDragging.value) {
          pos.top = dragging.value.top;
          //Add rtl support
          if (renderRtl.value) {
            pos.right = dragging.value.left;
          } else {
            pos.left = dragging.value.left;
          }
        }
        if (isResizing.value) {
          pos.width = resizing.width;
          pos.height = resizing.height;
        }

        let styleObj;
        // CSS Transforms support (default)
        if (useCssTransforms.value) {
          //Add rtl support
          if (renderRtl.value) {
            styleObj = setTransformRtl(
              pos.top,
              pos.right,
              pos.width,
              pos.height,
            );
          } else {
            styleObj = setTransform(pos.top, pos.left, pos.width, pos.height);
          }
        } else {
          // top,left (slow)
          //Add rtl support
          if (renderRtl.value) {
            styleObj = setTopRight(pos.top, pos.right, pos.width, pos.height);
          } else {
            styleObj = setTopLeft(pos.top, pos.left, pos.width, pos.height);
          }
        }
        style.value = styleObj;
      }
      function emitContainerResized() {
        // this.style has width and height with trailing 'px'. The
        // resized event is without them
        let styleProps: any = {};
        for (let prop of ['width', 'height']) {
          let val = style.value[prop];
          let matches = val.match(/^(\d+)px$/);
          if (!matches) return;
          styleProps[prop] = matches[1];
        }
        emit(
          'container-resized',
          props.i,
          props.h,
          props.w,
          styleProps.height,
          styleProps.width,
        );
      }
      function handleResize(event) {
        if (props.static) return;
        const position = getControlPosition(event);
        // Get the current drag point from the event. t is used as the offset.
        if (position == null) return; // not possible but satisfies flow
        const { x, y } = position;

        const newSize = { width: 0, height: 0 };
        let pos;
        switch (event.type) {
          case 'resizestart': {
            previousW.value = innerW.value;
            previousH.value = innerH.value;
            pos = calcPosition(
              innerX.value,
              innerY.value,
              innerW.value,
              innerH.value,
            );
            newSize.width = pos.width;
            newSize.height = pos.height;
            resizing = newSize;
            isResizing.value = true;
            break;
          }
          case 'resizemove': {
            const coreEvent = createCoreData(lastW.value, lastH.value, x, y);
            if (renderRtl.value) {
              newSize.width = resizing.width - coreEvent.deltaX;
            } else {
              newSize.width = resizing.width + coreEvent.deltaX;
            }
            newSize.height = resizing.height + coreEvent.deltaY;
            resizing = newSize;
            break;
          }
          case 'resizeend': {
            pos = calcPosition(
              innerX.value,
              innerY.value,
              innerW.value,
              innerH.value,
            );
            newSize.width = pos.width;
            newSize.height = pos.height;
            resizing = null;
            isResizing.value = false;
            break;
          }
        }

        // Get new WH
        pos = calcWH(newSize.height, newSize.width);
        if (pos.w < props.minW) {
          pos.w = props.minW;
        }
        if (pos.w > props.maxW) {
          pos.w = props.maxW;
        }
        if (pos.h < props.minH) {
          pos.h = props.minH;
        }
        if (pos.h > props.maxH) {
          pos.h = props.maxH;
        }

        if (pos.h < 1) {
          pos.h = 1;
        }
        if (pos.w < 1) {
          pos.w = 1;
        }

        lastW.value = x;
        lastH.value = y;

        if (innerW.value !== pos.w || innerH.value !== pos.h) {
          emit('resize', props.i, pos.h, pos.w, newSize.height, newSize.width);
        }
        if (
          event.type === 'resizeend' &&
          (previousW.value !== innerW.value || previousH.value !== innerH.value)
        ) {
          emit('resized', props.i, pos.h, pos.w, newSize.height, newSize.width);
        }
        eventBus.$emit(
          'resize-event',
          event.type,
          props.i,
          innerX.value,
          innerY.value,
          pos.h,
          pos.w,
        );
      }
      function handleDrag(event) {
        if (props.static) return;
        if (isResizing.value) return;

        const position = getControlPosition(event);

        // Get the current drag point from the event. This is used as the offset.
        if (position === null) return; // not possible but satisfies flow
        const { x, y } = position;

        // let shouldUpdate = false;
        let newPosition = { top: 0, left: 0 };
        switch (event.type) {
          case 'dragstart': {
            previousX.value = innerX.value;
            previousY.value = innerY.value;

            let parentRect = event.target.offsetParent.getBoundingClientRect();
            let clientRect = event.target.getBoundingClientRect();
            if (renderRtl.value) {
              newPosition.left = (clientRect.right - parentRect.right) * -1;
            } else {
              newPosition.left = clientRect.left - parentRect.left;
            }
            newPosition.top = clientRect.top - parentRect.top;
            dragging.value = newPosition;
            isDragging.value = true;
            break;
          }
          case 'dragend': {
            if (!isDragging.value) return;
            let parentRect = event.target.offsetParent.getBoundingClientRect();
            let clientRect = event.target.getBoundingClientRect();
            //                        Add rtl support
            if (renderRtl.value) {
              newPosition.left = (clientRect.right - parentRect.right) * -1;
            } else {
              newPosition.left = clientRect.left - parentRect.left;
            }
            newPosition.top = clientRect.top - parentRect.top;
            isDragging.value = false;
            break;
          }
          case 'dragmove': {
            const coreEvent = createCoreData(lastX.value, lastY.value, x, y);
            //Add rtl support
            if (renderRtl.value) {
              newPosition.left = dragging.value.left - coreEvent.deltaX;
            } else {
              newPosition.left = dragging.value.left + coreEvent.deltaX;
            }
            newPosition.top = dragging.value.top + coreEvent.deltaY;
            dragging.value = newPosition;
            break;
          }
        }

        // Get new XY
        let pos;
        if (renderRtl.value) {
          pos = calcXY(newPosition.top, newPosition.left);
        } else {
          pos = calcXY(newPosition.top, newPosition.left);
        }

        lastX.value = x;
        lastY.value = y;

        if (innerX.value !== pos.x || innerY.value !== pos.y) {
          emit('move', props.i, pos.x, pos.y);
        }
        if (
          event.type === 'dragend' &&
          (previousX.value !== innerX.value || previousY.value !== innerY.value)
        ) {
          emit('moved', props.i, pos.x, pos.y);
        }
        eventBus.$emit(
          'drag-event',
          event.type,
          props.i,
          pos.x,
          pos.y,
          innerH.value,
          innerW.value,
        );
      }
      function calcPosition(x, y, w, h) {
        const colWidth = calcColWidth();
        // add rtl support
        let out;
        if (renderRtl.value) {
          out = {
            right: Math.round(colWidth * x + (x + 1) * margin.value[0]),
            top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
            // 0 * Infinity === NaN, which causes problems with resize constriants;
            // Fix t if it occurs.
            // Note we do it here rather than later because Math.round(Infinity) causes deopt
            width:
              w === Infinity
                ? w
                : Math.round(
                    colWidth * w + Math.max(0, w - 1) * margin.value[0],
                  ),
            height:
              h === Infinity
                ? h
                : Math.round(
                    rowHeight.value * h + Math.max(0, h - 1) * margin.value[1],
                  ),
          };
        } else {
          out = {
            left: Math.round(colWidth * x + (x + 1) * margin.value[0]),
            top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
            // 0 * Infinity === NaN, which causes problems with resize constriants;
            // Fix this if it occurs.
            // Note we do it here rather than later because Math.round(Infinity) causes deopt
            width:
              w === Infinity
                ? w
                : Math.round(
                    colWidth * w + Math.max(0, w - 1) * margin.value[0],
                  ),
            height:
              h === Infinity
                ? h
                : Math.round(
                    rowHeight.value * h + Math.max(0, h - 1) * margin.value[1],
                  ),
          };
        }

        return out;
      }
      /**
       * Translate x and y coordinates from pixels to grid units.
       * @param  {Number} top  Top position (relative to parent) in pixels.
       * @param  {Number} left Left position (relative to parent) in pixels.
       * @return {Object} x and y in grid units.
       */
      // TODO check if this function needs change in order to support rtl.
      function calcXY(top, left) {
        const colWidth = calcColWidth();
        let x = Math.round(
          (left - margin.value[0]) / (colWidth + margin.value[0]),
        );
        let y = Math.round(
          (top - margin.value[1]) / (rowHeight.value + margin.value[1]),
        );

        // Capping
        x = Math.max(Math.min(x, cols.value - innerW.value), 0);
        y = Math.max(Math.min(y, maxRows.value - innerH.value), 0);

        return { x, y };
      }
      function calcColWidth() {
        const colWidth =
          (containerWidth.value - margin.value[0] * (cols.value + 1)) /
          cols.value;
        return colWidth;
      }
      /**
       * Given a height and width in pixel values, calculate grid units.
       * @param  {Number} height Height in pixels.
       * @param  {Number} width  Width in pixels.
       * @return {Object} w, h as grid units.
       */
      function calcWH(height, width) {
        const colWidth = calcColWidth();
        let w = Math.round(
          (width + margin.value[0]) / (colWidth + margin.value[0]),
        );
        let h = Math.round(
          (height + margin.value[1]) / (rowHeight.value + margin.value[1]),
        );

        // Capping
        w = Math.max(Math.min(w, cols.value - innerX.value), 0);
        h = Math.max(Math.min(h, maxRows.value - innerY.value), 0);
        return { w, h };
      }
      function updateWidth(width, colNum) {
        containerWidth.value = width;
        if (colNum !== undefined && colNum !== null) {
          cols.value = colNum;
        }
      }
      function compact() {
        createStyle();
      }
      function tryMakeDraggable() {
        if (interactObj === null || interactObj === undefined) {
          interactObj = interact(gridItem.value);
        }
        if (draggable.value && !props.static) {
          const opts = {
            ignoreFrom: props.dragIgnoreFrom,
            allowFrom: props.dragAllowFrom,
          };
          interactObj.draggable(opts);
          if (!dragEventSet.value) {
            dragEventSet.value = true;
            interactObj.on('dragstart dragmove dragend', (event) => {
              handleDrag(event);
            });
          }
        } else {
          interactObj.draggable({
            enabled: false,
          });
        }
      }
      function tryMakeResizable() {
        if (interactObj === null || interactObj === undefined) {
          interactObj = interact(gridItem.value);
        }
        if (resizable.value && !props.static) {
          let maximum = calcPosition(0, 0, props.maxW, props.maxH);
          let minimum = calcPosition(0, 0, props.minW, props.minH);

          const opts = {
            preserveAspectRatio: true,
            edges: {
              left: false,
              right: '.' + resizableHandleClass.value,
              bottom: '.' + resizableHandleClass.value,
              top: false,
            },
            ignoreFrom: props.resizeIgnoreFrom,
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

          interactObj.resizable(opts);
          if (!resizeEventSet.value) {
            resizeEventSet.value = true;
            interactObj.on('resizestart resizemove resizeend', (event) => {
              handleResize(event);
            });
          }
        } else {
          interactObj.resizable({
            enabled: false,
          });
        }
      }
      function autoSize() {
        // ok here we want to calculate if a resize is needed
        previousW.value = innerW.value;
        previousH.value = innerH.value;

        let newSize = root.$slots.default[0].elm.getBoundingClientRect();
        let pos = calcWH(newSize.height, newSize.width);
        if (pos.w < props.minW) {
          pos.w = props.minW;
        }
        if (pos.w > props.maxW) {
          pos.w = props.maxW;
        }
        if (pos.h < props.minH) {
          pos.h = props.minH;
        }
        if (pos.h > props.maxH) {
          pos.h = props.maxH;
        }

        if (pos.h < 1) {
          pos.h = 1;
        }
        if (pos.w < 1) {
          pos.w = 1;
        }

        if (innerW.value !== pos.w || innerH.value !== pos.h) {
          emit('resize', props.i, pos.h, pos.w, newSize.height, newSize.width);
        }
        if (previousW.value !== pos.w || previousH.value !== pos.h) {
          emit('resized', props.i, pos.h, pos.w, newSize.height, newSize.width);
          eventBus.$emit(
            'resize-event',
            'resizeend',
            props.i,
            innerX.value,
            innerY.value,
            pos.h,
            pos.w,
          );
        }
      }
      return {
        gridItem,
        activeTab,
        contentTab,
        style,
        resizableAndNotStatic,
        resizableHandleClass,
        classObj,
      };
    },
  });
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
  .flex {
    display: flex;
  }
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .content {
    flex: 1;
  }
  .tabs {
    background-color: #424242;
    color: #ffffff;
  }
  .tab {
    padding: 0.2rem;
    flex: 1;
    background-color: #424242;
    border: solid 1px #ccc;
    border-top-left-radius: 0.3rem;
    border-top-right-radius: 0.3rem;
  }
  .tab.active {
    background-color: #ccc;
    color: #000;
  }
  /* @media */
</style>
