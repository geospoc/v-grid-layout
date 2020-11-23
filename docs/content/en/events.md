---
title: Events
description: ''
position: 5
category: Getting Started
---

Move and resize event listeners can be added to each grid-item, so that the parent Vue can be notified when a grid element is being moved or resized. Moved and resized event listeners can be added, if the only notification needed is when an item is finished moving or resizing.

Working example [here](https://jbaysolutions.github.io/vue-grid-layout/examples/02-events.html)

```js

<grid-layout
  :layout="layout"
  :col-num="12"
  :row-height="30"
  :is-draggable="true"
  :is-resizable="true"
  :vertical-compact="true"
  :margin="[10, 10]"
  :use-css-transforms="true"
  @layout-created="layoutCreatedEvent"
  @layout-before-mount="layoutBeforeMountEvent"
  @layout-mounted="layoutMountedEvent"
  @layout-ready="layoutReadyEvent"
  @layout-updated="layoutUpdatedEvent"
  @breakpoint-changed="breakpointChangedEvent"
>
  <grid-item
    v-for="item in layout"
    :key="item.i"
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
    {{ item.i }}
  </grid-item>
</grid-layout>
```

### layoutCreatedEvent

Layout created event 

Emited on the component created lifecycle hook

```js
layoutCreatedEvent(newLayout) {
      console.log("Created layout: ", newLayout)
}
```

### layoutBeforeMountEvent

Layout beforeMount event

Emited on the component beforeMount lifecycle hook
```js
layoutBeforeMountEvent(newLayout) {
  console.log("beforeMount layout: ", newLayout)
}
```

### layoutMountedEvent

Layout mounted event

Emited on the component mounted lifecycle hook
```js
layoutMountedEvent(newLayout) {
  console.log("Mounted layout: ", newLayout)
}
```
### layoutReadyEvent

Layout ready event

Emited when all the operations on the mount hook finish
```js
layoutReadyEvent(newLayout) {
  console.log("Ready layout: ", newLayout)
}
```

### layoutUpdatedEvent

Layout updated event

Every time the layout has finished updating and positions of all grid-items are recalculated
```js
layoutUpdatedEvent(newLayout) {
  console.log("Updated layout: ", newLayout)
}
```

### moveEvent

Move event

Every time an item is being moved and changes position
```js
moveEvent(i, newX, newY) {
    console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
},
```

### resizeEvent

Resize event

Every time an item is being resized and changes size

```js
resizeEvent(i, newH, newW, newHPx, newWPx) {
    console.log("RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
},
```

### movedEvent

Moved event

Every time an item is finished being moved and changes position

```js
movedEvent(i, newX, newY) {
    console.log("MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
},
```

### resizedEvent

Resized event

Every time an item is finished being resized and changes size

```js
/**
  * 
  * @param i the item id/index
  * @param newH new height in grid rows 
  * @param newW new width in grid columns
  * @param newHPx new height in pixels
  * @param newWPx new width in pixels
  * 
  */
resizedEvent(i, newH, newW, newHPx, newWPx) {
    console.log("RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
},
```

### containerResizedEvent

Container Resized event

Every time the grid item/layout container changes size (browser window or other)

```js
/**
  * 
  * @param i the item id/index
  * @param newH new height in grid rows 
  * @param newW new width in grid columns
  * @param newHPx new height in pixels
  * @param newWPx new width in pixels
  * 
  */
containerResizedEvent(i, newH, newW, newHPx, newWPx) {
    console.log("CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
},
```

### breakpointChangedEvent

Breakpoint Changed event

Every time the breakpoint value changes due to window resize
```js
/**
  * 
  * @param newBreakpoint the breakpoint name
  * @param newLayout the chosen layout for the breakpoint
  * 
  */
breakpointChangedEvent(newBreakpoint, newLayout) {
    console.log("BREAKPOINT CHANGED breakpoint=", newBreakpoint, ", layout: ", newLayout );
},
```