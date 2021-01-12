import MultipleGrids from './MultipleGrids.vue';
export default { title: 'Examples' };
export const asAComponentWithMultipleGrids = () => ({
  components: { MultipleGrids },
  template: `<MultipleGrids/>`,
});
