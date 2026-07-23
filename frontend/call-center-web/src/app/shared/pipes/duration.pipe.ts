import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0 || !Number.isFinite(totalSeconds)) return '—';
    const seconds = Math.floor(totalSeconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    return hours > 0 ? `${hours}h ${minutes}m ${remaining}s` : minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
  }
}
