import Basic from './Basic.vue';
export default { title: 'Basic' };
export const asAComponentWithNoDrag = () => ({
  components: { Basic },
  template: `<Basic/>`,
});
