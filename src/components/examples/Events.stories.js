import Events from './Events.vue';
export default { title: 'Examples' };
export const asAComponentWithEvents = () => ({
  components: { Events },
  template: `<Events/>`,
});
