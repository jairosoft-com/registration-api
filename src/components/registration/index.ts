import registrationRoutes from './registration.routes';
import { IComponent } from '../../common/types/component';

const registrationComponent: IComponent = {
  name: 'registration',
  version: '1.0.0',
  router: registrationRoutes,
  basePath: '/v1/registration',
};

export default registrationComponent;
