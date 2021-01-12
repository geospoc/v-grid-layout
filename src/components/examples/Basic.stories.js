import Basic from './Basic.vue';
export default { title: 'Examples' };
export const asAComponentWithNoDrag = () => ({
  components: { Basic },
  template: `<Basic/>`,
});
