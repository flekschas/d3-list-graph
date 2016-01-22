import { ExtendableError } from '../commons/error.js';

export class NoRootNodes extends ExtendableError {
  constructor (message) {
    super(message || 'No root node IDs specified.');
  }
}
