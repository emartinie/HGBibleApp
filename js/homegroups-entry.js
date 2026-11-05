// The production entry installs the closed testing policy BEFORE the card app boots.
import {releasePolicy} from './fellowship-release-policy.js';
Object.defineProperty(window,'HGCardPolicy',{value:releasePolicy,writable:false,configurable:false});
await import('./card-app-runtime.js');
