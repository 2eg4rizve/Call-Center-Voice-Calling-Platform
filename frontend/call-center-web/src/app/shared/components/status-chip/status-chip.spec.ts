import { TestBed } from '@angular/core/testing';
import { STATUS_PRESENTATIONS } from '../../models/status.model';
import { StatusChip } from './status-chip';

describe('StatusChip', () => {
  it.each(Object.entries(STATUS_PRESENTATIONS))(
    'renders the %s status as readable text in addition to color',
    (status, presentation) => {
      const fixture = TestBed.createComponent(StatusChip);
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('.chip') as HTMLElement;
      const decorativeDot = fixture.nativeElement.querySelector('.dot') as HTMLElement;
      expect(chip.textContent?.trim()).toBe(presentation.label);
      expect(chip.classList.contains(`chip--${presentation.tone}`)).toBe(true);
      expect(decorativeDot.getAttribute('aria-hidden')).toBe('true');
    },
  );

  it('keeps an unknown future status readable without relying on a new color', () => {
    const fixture = TestBed.createComponent(StatusChip);
    fixture.componentRef.setInput('status', 'Inactive');
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip') as HTMLElement;
    expect(chip.textContent?.trim()).toBe('Inactive');
    expect(chip.classList.contains('chip--neutral')).toBe(true);
  });
});
