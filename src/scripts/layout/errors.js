import { ExtendableError } from '../commons/errors.js';

export class NoRootNodes extends ExtendableError {
  constructor (message) {
    super(message || 'No root node IDs specified.');
  }
}
