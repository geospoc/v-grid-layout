import Demo from './Demo.vue';
export default { title: 'Demo' };
export const asATestComponent = () => ({
  components: { Demo },
  template: `<Demo/>`,
});
