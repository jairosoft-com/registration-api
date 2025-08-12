import scheduleRoutes from './schedule.routes';
import { IComponent } from '../../common/types/component';

const scheduleComponent: IComponent = {
  name: 'schedule',
  version: '1.0.0',
  router: scheduleRoutes,
  basePath: '/v1/schedule',
};

export default scheduleComponent;
