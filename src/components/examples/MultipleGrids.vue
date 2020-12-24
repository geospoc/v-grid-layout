<template>
  <div>
    <div style="margin-top: 10px">
      <h4>Grid #1</h4>
      <grid-layout
        :layout.sync="layout"
        :col-num="12"
        :row-height="30"
        :is-draggable="true"
        :is-resizable="true"
        :vertical-compact="true"
        :use-css-transforms="true"
      >
        <grid-item
          v-for="(item, idx) in layout"
          :key="idx"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
        >
          <span class="text">{{ item.i }}</span>
        </grid-item>
      </grid-layout>
    </div>
    <div style="margin-top: 10px">
      <h4>Grid #2</h4>
      <grid-layout
        :layout="layout2"
        :col-num="12"
        :row-height="30"
        :is-draggable="true"
        :is-resizable="true"
        :vertical-compact="true"
        :use-css-transforms="true"
      >
        <grid-item
          v-for="(item, idx) in layout2"
          :key="idx"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
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
  import { defineComponent, ref, watch } from '@vue/composition-api';

  export default defineComponent({
    components: {
      GridLayout,
      GridItem,
    },

    setup() {
      // Event Log
      const eventLog = ref([]);

      watch(
        eventLog,
        () => {
          const eventsDiv = this.$refs.eventsDiv;
          eventsDiv.scrollTop = eventsDiv.scrollHeight;
        },
        {
          lazy: true,
        },
      );

      //

      const layout = ref([
        { x: 0, y: 0, w: 2, h: 2, i: '0' },
        { x: 2, y: 0, w: 2, h: 4, i: '1' },
      ]);

      const layout2 = ref([
        { x: 0, y: 0, w: 2, h: 2, i: '0' },
        { x: 2, y: 0, w: 2, h: 4, i: '1' },
        { x: 4, y: 0, w: 2, h: 2, i: '2' },
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
        layout2,
        draggable,
        resizable,
        index,
        eventLog,
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
  });
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
