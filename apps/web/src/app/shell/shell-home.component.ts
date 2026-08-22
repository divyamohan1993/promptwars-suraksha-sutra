import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-shell-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="welcome" aria-labelledby="welcome-title">
      <p class="eyebrow">Adaptive learning foundation</p>
      <h1 id="welcome-title">A safer next step, shaped around your learning.</h1>
      <p class="welcome__copy">
        SurakshaSutra will connect observation, practice, feedback, and review in one learner-owned
        workspace.
      </p>
      <p class="status-chip" role="status">Application shell ready</p>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .welcome {
      max-width: 46rem;
      padding: clamp(1.5rem, 5vw, 4rem) 0;
    }

    .eyebrow {
      margin: 0 0 1rem;
      color: var(--color-accent-strong);
      font-size: 0.8rem;
      font-weight: 750;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }

    h1 {
      max-width: 16ch;
      margin: 0;
      color: var(--color-ink);
      font-size: clamp(2.2rem, 6vw, 4.7rem);
      line-height: 1.02;
      letter-spacing: -0.045em;
    }

    .welcome__copy {
      max-width: 40rem;
      margin: 1.5rem 0 0;
      color: var(--color-muted);
      font-size: clamp(1.05rem, 2vw, 1.25rem);
      line-height: 1.6;
    }

    .status-chip {
      display: inline-flex;
      margin: 2rem 0 0;
      padding: 0.5rem 0.8rem;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      color: var(--color-accent-strong);
      background: var(--color-accent-soft);
      font-size: 0.9rem;
      font-weight: 650;
    }
  `,
})
export class ShellHomeComponent {}
