import Events from './Events.vue';
export default { title: 'Basic' };
export const asAComponentWithEvents = () => ({
  components: { Events },
  template: `<Events/>`,
});
