import DragFromOutside from './DragFromOutside.vue';
export default { title: 'Examples' };
export const asAComponentWithDragFromOutside = () => ({
  components: { DragFromOutside },
  template: `<DragFromOutside/>`,
});
