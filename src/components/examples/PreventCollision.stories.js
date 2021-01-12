import PreventCollision from './PreventCollision.vue';
export default { title: 'Examples' };
export const asAComponentWithPreventCollision = () => ({
  components: { PreventCollision },
  template: `<PreventCollision/>`,
});
