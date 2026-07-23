import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({ name: 'localDateTime', standalone: true })
export class LocalDateTimePipe implements PipeTransform {
  private readonly datePipe = new DatePipe('en-US');
  transform(value: string | Date | null | undefined, format = 'medium'): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : (this.datePipe.transform(date, format) ?? '—');
  }
}
