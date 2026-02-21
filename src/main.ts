import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig as appConfigTemplate } from './app/template/app.config';
import { AppComponent as AppComponentTemplate } from './app/template/app.component';
import { appConfig as appConfigCore } from './app/core/app.config';
import { AppComponent as AppComponentCore } from './app/core/app.component';

registerLocaleData(localeEsCo);

const project = 'core' as 'template' | 'core';

if (project == 'template') {
  bootstrapApplication(AppComponentTemplate, appConfigTemplate).catch((err) =>
    console.error(err),
  );
}

if (project == 'core') {
  bootstrapApplication(AppComponentCore, appConfigCore).catch((err) =>
    console.error(err),
  );
}
