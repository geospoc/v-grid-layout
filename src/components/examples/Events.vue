<template>
  <div>
    <div ref="eventsDiv" class="eventsJSON">
      <div v-for="(event, idx) in eventLog" :key="idx">
        {{ event }}
      </div>
    </div>
    <div style="margin-top: 10px">
      <grid-layout
        :layout.sync="layout"
        :col-num="12"
        :row-height="30"
        :is-draggable="draggable"
        :is-resizable="resizable"
        :vertical-compact="true"
        :use-css-transforms="true"
        @layout-created="layoutCreatedEvent"
        @layout-before-mount="layoutBeforeMountEvent"
        @layout-mounted="layoutMountedEvent"
        @layout-ready="layoutReadyEvent"
        @layout-updated="layoutUpdatedEvent"
      >
        <grid-item
          v-for="(item, idx) in layout"
          :key="idx"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          @resize="resizeEvent"
          @move="moveEvent"
          @resized="resizedEvent"
          @container-resized="containerResizedEvent"
          @moved="movedEvent"
        >
          <span class="text">{{ item.i }}</span>
        </grid-item>
      </grid-layout>
    </div>
  </div>
</template>
<script>
  import GridLayout from '@/components/GridLayout';
  import GridItem from '@/components/GridItem';
  import { onMounted, ref, watch } from '@vue/composition-api';

  export default {
    components: {
      GridLayout,
      GridItem,
    },

    setup() {
      // Event Log
      const eventLog = ref([]);
      const eventsDiv = ref([]);

      watch(
        eventLog,
        () => {
          console.log(
            'eventsDivwatch',
            eventsDiv.value.scrollTop,
            eventsDiv.value.scrollTop,
          );
          if (eventsDiv) {
            eventsDiv.value.scrollTop = eventsDiv.value.scrollHeight;
          }
        },
        {
          lazy: true,
        },
      );

      const layout = ref([
        { x: 0, y: 0, w: 2, h: 2, i: '0', static: false },
        { x: 2, y: 0, w: 2, h: 4, i: '1', static: true },
        { x: 4, y: 0, w: 2, h: 5, i: '2', static: false },
        { x: 6, y: 0, w: 2, h: 3, i: '3', static: false },
        { x: 8, y: 0, w: 2, h: 3, i: '4', static: false },
        { x: 10, y: 0, w: 2, h: 3, i: '5', static: false },
        { x: 0, y: 5, w: 2, h: 5, i: '6', static: false },
        { x: 2, y: 5, w: 2, h: 5, i: '7', static: false },
        { x: 4, y: 5, w: 2, h: 5, i: '8', static: false },
        { x: 6, y: 3, w: 2, h: 4, i: '9', static: true },
        { x: 8, y: 4, w: 2, h: 4, i: '10', static: false },
        { x: 10, y: 4, w: 2, h: 4, i: '11', static: false },
        { x: 0, y: 10, w: 2, h: 5, i: '12', static: false },
        { x: 2, y: 10, w: 2, h: 5, i: '13', static: false },
        { x: 4, y: 8, w: 2, h: 4, i: '14', static: false },
        { x: 6, y: 8, w: 2, h: 4, i: '15', static: false },
        { x: 8, y: 10, w: 2, h: 5, i: '16', static: false },
        { x: 10, y: 4, w: 2, h: 2, i: '17', static: false },
        { x: 0, y: 9, w: 2, h: 3, i: '18', static: false },
        { x: 2, y: 6, w: 2, h: 2, i: '19', static: false },
      ]);

      const resizable = ref(true);
      // Event Resized

      function resizeEvent(i, newH, newW, newHPx, newWPx) {
        const msg =
          'RESIZE i=' +
          i +
          ', H=' +
          newH +
          ', W=' +
          newW +
          ', H(px)=' +
          newHPx +
          ', W(px)=' +
          newWPx;
        eventLog.value.push(msg);
      }

      function resizedEvent(i, newX, newY, newHPx, newWPx) {
        const msg =
          'RESIZED i=' +
          i +
          ', X=' +
          newX +
          ', Y=' +
          newY +
          ', H(px)=' +
          newHPx +
          ', W(px)=' +
          newWPx;
        eventLog.value.push(msg);
      }

      function containerResizedEvent(i, newH, newW, newHPx, newWPx) {
        const msg =
          'CONTAINER RESIZED i=' +
          i +
          ', H=' +
          newH +
          ', W=' +
          newW +
          ', H(px)=' +
          newHPx +
          ', W(px)=' +
          newWPx;
        eventLog.value.push(msg);
      }

      // Layout Event

      function layoutCreatedEvent(newLayout) {
        eventLog.value.push('Created layout');
      }

      function layoutReadyEvent(newLayout) {
        eventLog.value.push('Ready layout');
      }

      function layoutUpdatedEvent(newLayout) {
        eventLog.value.push('Updated layout');
      }

      // Layout Event

      function layoutBeforeMountEvent(newLayout) {
        eventLog.value.push('beforeMount layout');
      }

      function layoutMountedEvent(newLayout) {
        eventLog.value.push('Mounted layout');
      }

      // Event

      function moveEvent(i, newX, newY) {
        const msg = 'MOVE i=' + i + ', X=' + newX + ', Y=' + newY;
        eventLog.value.push(msg);
      }

      function movedEvent(i, newX, newY) {
        const msg = 'MOVED i=' + i + ', X=' + newX + ', Y=' + newY;
        eventLog.value.push(msg);
      }

      // Misc
      const draggable = ref(true);
      const index = ref(0);

      return {
        layout,
        draggable,
        resizable,
        index,
        eventLog,
        eventsDiv,
        moveEvent,
        movedEvent,
        resizeEvent,
        resizedEvent,
        containerResizedEvent,
        layoutCreatedEvent,
        layoutBeforeMountEvent,
        layoutMountedEvent,
        layoutReadyEvent,
        layoutUpdatedEvent,
      };
    },
  };
</script>

<style scoped>
  .vue-grid-layout {
    background: #eee;
  }

  .vue-grid-item:not(.vue-grid-placeholder) {
    background: #ccc;
    border: 1px solid black;
  }

  .vue-grid-item .resizing {
    opacity: 0.9;
  }

  .vue-grid-item .static {
    background: #cce;
  }

  .vue-grid-item .text {
    font-size: 24px;
    text-align: center;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    height: 100%;
    width: 100%;
  }

  .vue-grid-item .no-drag {
    height: 100%;
    width: 100%;
  }

  .vue-grid-item .minMax {
    font-size: 12px;
  }

  .vue-grid-item .add {
    cursor: pointer;
  }

  .vue-draggable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 0;
    left: 0;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>")
      no-repeat;
    background-position: bottom right;
    padding: 0 8px 8px 0;
    background-repeat: no-repeat;
    background-origin: content-box;
    box-sizing: border-box;
    cursor: pointer;
  }

  .layoutJSON {
    background: #ddd;
    border: 1px solid black;
    margin-top: 10px;
    padding: 10px;
  }

  .eventsJSON {
    background: #ddd;
    border: 1px solid black;
    margin-top: 10px;
    padding: 10px;
    height: 100px;
    overflow-y: scroll;
  }
</style>
