// Internal
import { ExtendableError } from '../commons/error';

export class LayoutNotAvailable extends ExtendableError {
  constructor (message) {
    super(message || 'D3.layout.listGraph.js has not been loaded yet.');
  }
}

export class EventDispatcherNoFunction extends ExtendableError {
  constructor (message) {
    super(message || 'Dispatcher needs to be a function.');
  }
}
