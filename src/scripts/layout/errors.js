import { ExtendableError } from '../commons/errors';

/**
 * Error class when no root ID is given.
 */
export class NoRootNodes extends ExtendableError {
  constructor (message) {
    super(message || 'No root node IDs specified.');
  }
}
