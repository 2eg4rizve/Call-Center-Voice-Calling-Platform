import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();
  it('formats seconds, minutes, and hours', () => {
    expect(pipe.transform(8)).toBe('8s');
    expect(pipe.transform(125)).toBe('2m 5s');
    expect(pipe.transform(3725)).toBe('1h 2m 5s');
  });
  it('handles invalid values', () => expect(pipe.transform(-1)).toBe('—'));
});
