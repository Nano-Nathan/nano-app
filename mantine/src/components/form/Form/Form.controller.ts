import FormController from '@nano-app/controllers/form';
import { Input, Password } from '../../fields';

/** Form whose passwords show with their own input, every other type with the input */
export default class InputFormController extends FormController {
  protected components = { text: Input, password: Password };
}
