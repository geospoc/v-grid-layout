import Responsive from './Responsive.vue';
export default { title: 'Responsive' };
export const asAComponentWithResponsiveness = () => ({
  components: { Responsive },
  template: `<Responsive />`,
});
