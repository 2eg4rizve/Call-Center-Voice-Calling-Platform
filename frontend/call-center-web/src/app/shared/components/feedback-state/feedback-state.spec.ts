import { TestBed } from '@angular/core/testing';
import { FeedbackStateComponent } from './feedback-state';

describe('FeedbackStateComponent', () => {
  it('announces loading state', () => {
    const fixture = TestBed.createComponent(FeedbackStateComponent);
    fixture.componentRef.setInput('state', 'loading'); fixture.componentRef.setInput('title', 'Loading calls'); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('section')?.getAttribute('aria-busy')).toBe('true');
    expect(element.textContent).toContain('Loading calls');
  });

  it('renders an empty state without retry action', () => {
    const fixture = TestBed.createComponent(FeedbackStateComponent);
    fixture.componentRef.setInput('state', 'empty'); fixture.componentRef.setInput('title', 'No calls'); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('emits retry from its keyboard-operable button', () => {
    const fixture = TestBed.createComponent(FeedbackStateComponent);
    fixture.componentRef.setInput('state', 'error'); fixture.componentRef.setInput('title', 'Unable to load');
    const retry = vi.fn(); fixture.componentInstance.retry.subscribe(retry); fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    button.focus(); button.click();
    expect(document.activeElement).toBe(button); expect(retry).toHaveBeenCalledOnce();
  });
});
