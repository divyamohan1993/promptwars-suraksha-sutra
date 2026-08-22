import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

void bootstrapApplication(App, appConfig).catch((error: unknown) => {
  globalThis.reportError?.(error);
});
