import Responsive from './Responsive.vue';
export default { title: 'Examples' };
export const asAComponentWithResponsiveGridLayout = () => ({
  components: { Responsive },
  template: `<Responsive/>`,
});
