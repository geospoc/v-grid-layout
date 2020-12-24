import DynamicAddRemove from './DynamicAddRemove.vue';
export default { title: 'Examples' };
export const asAComponentWithDynamicAddOrRemove = () => ({
  components: { DynamicAddRemove },
  template: `<DynamicAddRemove/>`,
});
