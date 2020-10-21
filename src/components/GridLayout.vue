<template>
  <div ref="gridLayout" class="vue-grid-layout" :style="mergedStyle">
    <slot></slot>
    <grid-item
      v-show="isDragging"
      class="vue-grid-placeholder"
      :x="placeholder.x"
      :y="placeholder.y"
      :w="placeholder.w"
      :h="placeholder.h"
      :i="placeholder.i"
    />
  </div>
</template>
<script lang="ts">
  import Vue, { createApp, getCurrentInstance } from 'vue';
  import {
    defineComponent,
    reactive,
    ref,
    watch,
    onBeforeMount,
    onMounted,
    onBeforeUnmount,
  } from 'vue';
  import elementResizeDetectorMaker from 'element-resize-detector';
  import mitt from 'mitt';
  import {
    bottom,
    compact,
    getLayoutItem,
    moveElement,
    validateLayout,
    cloneLayout,
    getAllCollisions,
    provideEventBus,
    useEventBus,
  } from '../helpers/utils';
  import {
    getBreakpointFromWidth,
    getColsFromBreakpoint,
    findOrGenerateResponsiveLayout,
  } from '../helpers/responsiveUtils';
  //var eventBus = require('./eventBus');
  import GridItem from './GridItem.vue';
  import {
    addWindowEventListener,
    removeWindowEventListener,
  } from '../helpers/DOM';

  export default defineComponent({
    name: 'GridLayout',
    components: {
      GridItem,
    },
    props: {
      // If true, the container height swells and contracts to fit contents
      autoSize: {
        type: Boolean,
        default: true,
      },
      colNum: {
        type: Number,
        default: 12,
      },
      rowHeight: {
        type: Number,
        default: 150,
      },
      maxRows: {
        type: Number,
        default: Infinity,
      },
      margin: {
        type: Array,
        default() {
          return [10, 10];
        },
      },
      isDraggable: {
        type: Boolean,
        default: true,
      },
      isResizable: {
        type: Boolean,
        default: true,
      },
      isMirrored: {
        type: Boolean,
        default: false,
      },
      useCssTransforms: {
        type: Boolean,
        default: true,
      },
      verticalCompact: {
        type: Boolean,
        default: true,
      },
      layout: {
        type: Array,
        required: true,
      },
      responsive: {
        type: Boolean,
        default: false,
      },
      responsiveLayouts: {
        type: Object,
        default() {
          return {};
        },
      },
      breakpoints: {
        type: Object,
        default() {
          return { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
        },
      },
      cols: {
        type: Object,
        default() {
          return { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
        },
      },
      preventCollision: {
        type: Boolean,
        default: false,
      },
    },
    setup(props: any, { root, emit }: any) {
      root = getCurrentInstance().parent.ctx;
      provideEventBus(mitt());
      const eventBus: any = useEventBus();
      let erd: any = null; //for element resize detetctor
      const width = ref<number>(0);
      let mergedStyle = ref({});
      const lastLayoutLength = ref(0);
      let isDragging = ref(false);
      const gridLayout = ref<any | null>(null);
      const placeholder = reactive({
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        i: -1,
      });
      let layouts = reactive({});
      const lastBreakpoint = ref<string>('');
      let originalLayout = ref<any>({});
      let layout = ref<any>(props.layout);
      // width
      watch(
        () => width.value,
        (width, oldWidth) => {
          root.$nextTick(() => {
            eventBus.emit('updateWidth', width);
            if (oldWidth === null) {
              /*
              If oldval == null is when the width has never been
              set before. That only occurs when mouting is
              finished, and onWindowResize has been called and
              this.width has been changed the first time after it
              got set to null in the constructor. It is now time
              to issue layout-ready events as the GridItems have
              their sizes configured properly.

              The reason for emitting the layout-ready events on
              the next tick is to allow for the newly-emitted
              updateWidth event (above) to have reached the
              children GridItem-s and had their effect, so we're
              sure that they have the final size before we emit
              layout-ready (for this GridLayout) and
              item-layout-ready (for the GridItem-s).

              This way any client event handlers can reliably
              invistigate stable sizes of GridItem-s.
            */
              root.$nextTick(() => {
                emit('layout-ready', root.layout);
              });
            }
            updateHeight();
          });
        },
      );
      // layout
      watch(
        () => props.layout,
        (newlayout, oldLayout) => {
          layout.value = newlayout;
          layoutUpdate();
        },
      );
      // colNum
      watch(
        () => props.colNum,
        (colNum, oldColNum) => {
          eventBus.emit('setColNum', colNum);
        },
      );
      // rowHeight
      watch(
        () => props.rowHeight,
        (rowHeight, oldrowHeight) => {
          eventBus.emit('setRowHeight', rowHeight);
        },
      );
      // isDraggable
      watch(
        () => props.isDraggable,
        (isDraggable, oldIsDraggable) => {
          eventBus.emit('setDraggable', isDraggable);
        },
      );
      // isResizable
      watch(
        () => props.isResizable,
        (isResizable, oldIsResizable) => {
          eventBus.emit('setResizable', isResizable);
        },
      );
      // responsive
      watch(
        () => props.responsive,
        (responsive, oldResponsive) => {
          if (!responsive) {
            emit('update:layout', originalLayout.value);
            eventBus.emit('setColNum', props.colNum);
          }
          onWindowResize();
        },
      );
      // maxRows
      watch(
        () => props.maxRows,
        (maxRows, oldMaxRows) => {
          eventBus.emit('setMaxRows', maxRows);
        },
      );
      // margin
      watch(
        () => props.margin,
        (margin, oldMargin) => {
          updateHeight();
        },
      );
      // created section
      const resizeEventHandler = (data) => {
        if (!data) return;
        resizeEvent(data.eventType, data.i, data.x, data.y, data.h, data.w);
      };
      const dragEventHandler = (data) => {
        if (!data) return;
        dragEvent(data.eventType, data.i, data.x, data.y, data.h, data.w);
      };
      eventBus.on('resizeEvent', resizeEventHandler);
      eventBus.on('dragEvent', dragEventHandler);
      emit('layout-created', layout.value);

      onBeforeMount(() => {
        emit('layout-before-mount', layout.value);
      });

      onMounted(() => {
        emit('layout-mounted', layout.value);
        root.$nextTick(() => {
          validateLayout(layout.value, '');
          originalLayout.value = layout.value;
          // const t = this;
          root.$nextTick(() => {
            onWindowResize();
            initResponsiveFeatures();
            addWindowEventListener('resize', onWindowResize);
            compact(layout.value, props.verticalCompact);
            emit('layout-updated', layout.value);
            updateHeight();
            root.$nextTick(() => {
              erd = elementResizeDetectorMaker({
                strategy: 'scroll', //<- For ultra performance.
                // See https://github.com/wnr/element-resize-detector/issues/110 about callOnAdd.
                callOnAdd: false,
              });
              erd.listenTo(gridLayout.value, () => {
                onWindowResize();
              });
            });
          });
        });
      });
      onBeforeUnmount(() => {
        //Remove listeners
        eventBus.off('resizeEvent', resizeEventHandler);
        eventBus.off('dragEvent', dragEventHandler);
        eventBus.all.clear();
        removeWindowEventListener('resize', onWindowResize);
        if (erd) {
          erd.uninstall(gridLayout.value);
        }
      });
      // methods
      function layoutUpdate() {
        if (layout.value !== undefined && originalLayout.value !== null) {
          if (layout.value.length !== originalLayout.value.length) {
            let diff = findDifference(layout.value, originalLayout.value);
            if (diff.length > 0) {
              if (layout.value.length > originalLayout.value.length) {
                originalLayout.value = originalLayout.value.concat(diff);
              } else {
                originalLayout.value = originalLayout.value.filter((obj) => {
                  return !diff.some((obj2) => {
                    return obj.i === obj2.i;
                  });
                });
              }
            }

            lastLayoutLength.value = layout.value.length;
            initResponsiveFeatures();
          }

          compact(layout.value, props.verticalCompact);
          eventBus.emit('updateWidth', width.value);
          updateHeight();

          emit('layout-updated', layout.value);
        }
      }
      function updateHeight() {
        mergedStyle.value = {
          height: containerHeight(),
        };
      }
      function onWindowResize() {
        if (gridLayout.value !== null && gridLayout.value !== undefined) {
          width.value = gridLayout.value.offsetWidth;
        }
        eventBus.emit('resizeEvent');
      }
      function containerHeight() {
        if (!props.autoSize) return;
        const containerHeight =
          bottom(layout.value) * (props.rowHeight + props.margin[1]) +
          props.margin[1] +
          'px';
        return containerHeight;
      }
      function dragEvent(eventName, id, x, y, h, w) {
        let l = getLayoutItem(layout.value, id);
        //GetLayoutItem sometimes returns null object
        if (l === undefined || l === null) {
          l = { x: 0, y: 0, w: 0, h: 0, i: '' };
        }

        if (eventName === 'dragmove' || eventName === 'dragstart') {
          placeholder.i = id;
          placeholder.x = l.x;
          placeholder.y = l.y;
          placeholder.w = w;
          placeholder.h = h;
          root.$nextTick(() => {
            isDragging.value = true;
          });
          eventBus.emit('updateWidth', width.value);
        } else {
          root.$nextTick(() => {
            isDragging.value = false;
          });
        }

        // Move the element to the dragged location.
        layout.value = moveElement(
          layout.value,
          l,
          x,
          y,
          true,
          props.preventCollision,
        );
        compact(layout.value, props.verticalCompact);
        // needed because vue can't detect changes on array element properties
        eventBus.emit('compact');
        updateHeight();
        if (eventName === 'dragend') emit('layout-updated', layout.value);
      }
      function resizeEvent(eventName, id, x, y, h, w) {
        let l = getLayoutItem(layout.value, id);
        //GetLayoutItem sometimes return null object
        if (l === undefined || l === null) {
          l = { x: 0, y: 0, w: 0, h: 0, i: '' };
        }

        let hasCollisions;
        if (props.preventCollision) {
          const collisions = getAllCollisions(layout.value, {
            ...l,
            w,
            h,
          }).filter((layoutItem) => l !== null && layoutItem.i !== l.i);
          hasCollisions = collisions.length > 0;

          // If we're colliding, we need adjust the placeholder.
          if (hasCollisions) {
            // adjust w && h to maximum allowed space
            let leastX = Infinity,
              leastY = Infinity;
            collisions.forEach((layoutItem) => {
              if (l !== null && layoutItem.x > l.x)
                leastX = Math.min(leastX, layoutItem.x);
              if (l !== null && layoutItem.y > l.y)
                leastY = Math.min(leastY, layoutItem.y);
            });

            if (Number.isFinite(leastX)) l.w = leastX - l.x;
            if (Number.isFinite(leastY)) l.h = leastY - l.y;
          }
        }

        if (!hasCollisions) {
          // Set new width and height.
          l.w = w;
          l.h = h;
        }

        if (eventName === 'resizestart' || eventName === 'resizemove') {
          placeholder.i = id;
          placeholder.x = x;
          placeholder.y = y;
          placeholder.w = l.w;
          placeholder.h = l.h;
          root.$nextTick(() => {
            isDragging.value = true;
          });
          eventBus.emit('updateWidth', width.value);
        } else {
          root.$nextTick(() => {
            isDragging.value = false;
          });
        }

        if (props.responsive) responsiveGridLayout();

        compact(layout.value, props.verticalCompact);
        eventBus.emit('compact');
        updateHeight();
        if (eventName === 'resizeend') emit('layout-updated', layout.value);
      }
      // finds or generates new layouts for set breakpoints
      function responsiveGridLayout() {
        let newBreakpoint = getBreakpointFromWidth(
          props.breakpoints,
          width.value,
        );
        let newCols = getColsFromBreakpoint(newBreakpoint, props.cols);

        // save actual layout in layouts
        if (lastBreakpoint.value !== '' && layouts[lastBreakpoint.value])
          layouts[lastBreakpoint.value] = cloneLayout(props.layout);

        // Find or generate a new layout.
        let layout = findOrGenerateResponsiveLayout(
          originalLayout.value,
          layouts,
          props.breakpoints,
          newBreakpoint,
          lastBreakpoint.value,
          newCols,
          props.verticalCompact,
        );

        // Store the new layout.
        layouts[newBreakpoint] = layout;

        if (lastBreakpoint.value !== newBreakpoint) {
          emit('breakpoint-changed', newBreakpoint, layout);
        }

        // new prop sync
        emit('update:layout', layout);

        lastBreakpoint.value = newBreakpoint;
        eventBus.emit(
          'setColNum',
          getColsFromBreakpoint(newBreakpoint, props.cols),
        );
      }
      // clear all responsive layouts
      function initResponsiveFeatures() {
        // clear layouts
        layouts = Object.assign({}, props.responsiveLayouts);
      }
      // find difference in layouts
      function findDifference(layout, originalLayout) {
        //Find values that are in result1 but not in result2
        let uniqueResultOne = layout.filter((obj) => {
          return !originalLayout.some((obj2) => {
            return obj.i === obj2.i;
          });
        });

        //Find values that are in result2 but not in result1
        let uniqueResultTwo = originalLayout.value.filter((obj) => {
          return !layout.some((obj2) => {
            return obj.i === obj2.i;
          });
        });

        //Combine the two arrays of unique entries#
        return uniqueResultOne.concat(uniqueResultTwo);
      }
      return { placeholder, mergedStyle, isDragging, gridLayout, width };
    },
  });
</script>
<style>
  .vue-grid-layout {
    position: relative;
    transition: height 200ms ease;
  }
</style>
