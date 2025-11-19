declare module '@fullcalendar/react' {
  import { Component } from 'react';
  import { CalendarOptions } from '@fullcalendar/core';

  export default class FullCalendar extends Component<CalendarOptions> {}
}

declare module '@fullcalendar/daygrid' {
  import { PluginDef } from '@fullcalendar/core';
  const dayGridPlugin: PluginDef;
  export default dayGridPlugin;
}

declare module '@fullcalendar/interaction' {
  import { PluginDef } from '@fullcalendar/core';
  const interactionPlugin: PluginDef;
  export default interactionPlugin;
}