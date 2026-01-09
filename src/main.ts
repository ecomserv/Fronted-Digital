import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// =================================================================
// PLAN OMEGA: AGGRESSIVE SCROLL FIX
// Override scrollIntoView to prevent iOS/Android from forcefully
// scrolling the page when the keyboard opens.
// =================================================================
try {
  if (typeof window !== 'undefined' && typeof Element !== 'undefined') {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (title?: boolean | ScrollIntoViewOptions) {
      const isMobile = window.innerWidth < 768;
      const isInput = this instanceof HTMLInputElement ||
        this instanceof HTMLTextAreaElement ||
        this instanceof HTMLSelectElement;

      // If mobile and input is focusing, BLOCK standard scroll behavior
      if (isMobile && isInput) {
        // console.debug('Auto-scroll blocked by Plan Omega');
        return;
      }
      return originalScrollIntoView.apply(this, arguments as any);
    };
  }
} catch (e) {
  console.warn('Omega Fix Error:', e);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
