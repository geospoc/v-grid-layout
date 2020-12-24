import MultipleGrids from './MultipleGrids.vue';
export default { title: 'Basic' };
export const asAComponentWithMultipleGrids = () => ({
  components: { MultipleGrids },
  template: `<MultipleGrids/>`,
});
