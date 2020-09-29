import Basic from './Basic.vue';
export default { title: 'Basic' };
export const asAComponentWithBasicFunctionalities = () => ({
  components: { Basic },
  template: `<Basic/>`,
});
