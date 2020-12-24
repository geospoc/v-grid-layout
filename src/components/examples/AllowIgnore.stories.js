import AllowIgnore from './AllowIgnore.vue';
export default { title: 'Examples' };
export const asAComponentWithDragAllowOrIgnoreOnElements = () => ({
  components: { AllowIgnore },
  template: `<AllowIgnore/>`,
});
