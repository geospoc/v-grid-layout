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
  import Vue from 'vue';
  import {
    defineComponent,
    reactive,
    ref,
    watch,
    onBeforeMount,
    onMounted,
    onBeforeUnmount,
  } from '@vue/composition-api';
  import elementResizeDetectorMaker from 'element-resize-detector';
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
      provideEventBus(new Vue());
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
      let originalLayout = reactive<any>({});

      // width
      watch(
        () => width.value,
        (width, oldWidth) => {
          root.$nextTick(() => {
            eventBus.$emit('update-width', width);
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
        (layout, oldLayout) => {
          layoutUpdate();
        },
      );
      // colNum
      watch(
        () => props.colNum,
        (colNum, oldColNum) => {
          eventBus.$emit('set-col-num', colNum);
        },
      );
      // rowHeight
      watch(
        () => props.rowHeight,
        (rowHeight, oldrowHeight) => {
          eventBus.$emit('set-row-height', rowHeight);
        },
      );
      // isDraggable
      watch(
        () => props.isDraggable,
        (isDraggable, oldIsDraggable) => {
          eventBus.$emit('set-draggable', isDraggable);
        },
      );
      // isResizable
      watch(
        () => props.isResizable,
        (isResizable, oldIsResizable) => {
          eventBus.$emit('set-resizable', isResizable);
        },
      );
      // responsive
      watch(
        () => props.responsive,
        (responsive, oldResponsive) => {
          if (!responsive) {
            emit('update:layout', originalLayout);
            eventBus.$emit('set-col-num', props.colNum);
          }
          onWindowResize();
        },
      );
      // maxRows
      watch(
        () => props.maxRows,
        (maxRows, oldMaxRows) => {
          eventBus.$emit('set-max-rows', maxRows);
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
      const resizeEventHandler = (eventType, i, x, y, h, w) => {
        resizeEvent(eventType, i, x, y, h, w);
      };
      const dragEventHandler = (eventType, i, x, y, h, w) => {
        dragEvent(eventType, i, x, y, h, w);
      };
      eventBus.$on('resize-event', resizeEventHandler);
      eventBus.$on('drag-event', dragEventHandler);
      emit('layout-created', props.layout);

      onBeforeMount(() => {
        emit('layout-before-mount', props.layout);
      });

      onMounted(() => {
        emit('layout-mounted', props.layout);
        // console.log('root', root);
        root.$nextTick(() => {
          validateLayout(props.layout, '');
          originalLayout = props.layout;
          // const t = this;
          root.$nextTick(() => {
            onWindowResize();
            initResponsiveFeatures();
            addWindowEventListener('resize', onWindowResize);
            compact(props.layout, props.verticalCompact);
            emit('layout-updated', props.layout);
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
        eventBus.$off('resize-event', resizeEventHandler);
        eventBus.$off('drag-event', dragEventHandler);
        eventBus.$destroy();
        removeWindowEventListener('resize', onWindowResize);
        if (erd) {
          erd.uninstall(gridLayout.value);
        }
      });
      // methods
      function layoutUpdate() {
        if (props.layout !== undefined && originalLayout !== null) {
          if (props.layout.length !== originalLayout.length) {
            let diff = findDifference(props.layout, originalLayout);
            if (diff.length > 0) {
              if (props.layout.length > originalLayout.length) {
                originalLayout = originalLayout.concat(diff);
              } else {
                originalLayout = originalLayout.filter((obj) => {
                  return !diff.some((obj2) => {
                    return obj.i === obj2.i;
                  });
                });
              }
            }

            lastLayoutLength.value = props.layout.length;
            initResponsiveFeatures();
          }

          compact(props.layout, props.verticalCompact);
          eventBus.$emit('update-width', width.value);
          updateHeight();

          emit('layout-updated', props.layout);
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
        eventBus.$emit('resize-event');
      }
      function containerHeight() {
        if (!props.autoSize) return;
        const containerHeight =
          bottom(props.layout) * (props.rowHeight + props.margin[1]) +
          props.margin[1] +
          'px';
        return containerHeight;
      }
      function dragEvent(eventName, id, x, y, h, w) {
        let l = getLayoutItem(props.layout, id);
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
          eventBus.$emit('update-width', width.value);
        } else {
          root.$nextTick(() => {
            isDragging.value = false;
          });
        }

        // Move the element to the dragged location.
        props.layout = moveElement(
          props.layout,
          l,
          x,
          y,
          true,
          props.preventCollision,
        );
        compact(props.layout, props.verticalCompact);
        // needed because vue can't detect changes on array element properties
        eventBus.$emit('compact');
        updateHeight();
        if (eventName === 'dragend') emit('layout-updated', props.layout);
      }
      function resizeEvent(eventName, id, x, y, h, w) {
        let l = getLayoutItem(props.layout, id);
        //GetLayoutItem sometimes return null object
        if (l === undefined || l === null) {
          l = { x: 0, y: 0, w: 0, h: 0, i: '' };
        }

        let hasCollisions;
        if (props.preventCollision) {
          const collisions = getAllCollisions(props.layout, {
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
          eventBus.$emit('update-width', width.value);
        } else {
          root.$nextTick(() => {
            isDragging.value = false;
          });
        }

        if (props.responsive) responsiveGridLayout();

        compact(props.layout, props.verticalCompact);
        eventBus.$emit('compact');
        updateHeight();
        if (eventName === 'resizeend') emit('layout-updated', props.layout);
      }
      // finds or generates new layouts for set breakpoints
      function responsiveGridLayout() {
        let newBreakpoint = getBreakpointFromWidth(
          props.breakpoints,
          width.value,
        );
        let newCols = getColsFromBreakpoint(newBreakpoint, props.cols);

        // save actual layout in layouts
        if (lastBreakpoint.value != null && layouts[lastBreakpoint.value])
          layouts[lastBreakpoint.value] = cloneLayout(props.layout);

        // Find or generate a new layout.
        let layout = findOrGenerateResponsiveLayout(
          originalLayout,
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
        eventBus.$emit(
          'set-col-num',
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
        let uniqueResultTwo = originalLayout.filter((obj) => {
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
