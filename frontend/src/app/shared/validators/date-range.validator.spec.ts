import { FormControl, FormGroup, Validators } from '@angular/forms';
import { dateRangeValidator } from './date-range.validator';

describe('dateRangeValidator', () => {
  function buildGroup(start: string | null, end: string | null): FormGroup {
    return new FormGroup(
      {
        startDate: new FormControl(start, Validators.required),
        endDate: new FormControl(end, Validators.required)
      },
      { validators: dateRangeValidator('startDate', 'endDate') }
    );
  }

  it('devuelve null cuando ambos valores están vacíos', () => {
    const group = buildGroup('', '');
    expect(group.errors?.['dateRange']).toBeUndefined();
  });

  it('devuelve null cuando falta startDate', () => {
    const group = buildGroup('', '2026-08-01');
    expect(group.errors?.['dateRange']).toBeUndefined();
  });

  it('devuelve null cuando falta endDate', () => {
    const group = buildGroup('2026-08-01', '');
    expect(group.errors?.['dateRange']).toBeUndefined();
  });

  it('acepta una fecha final posterior a la inicial', () => {
    const group = buildGroup('2026-08-01', '2026-08-02');
    expect(group.errors?.['dateRange']).toBeUndefined();
  });

  it('rechaza una fecha final anterior a la inicial', () => {
    const group = buildGroup('2026-08-10', '2026-08-01');
    expect(group.errors?.['dateRange']).toEqual({
      startDate: '2026-08-10',
      endDate: '2026-08-01'
    });
  });

  it('rechaza fechas iguales', () => {
    const group = buildGroup('2026-08-05', '2026-08-05');
    expect(group.errors?.['dateRange']).toEqual({
      startDate: '2026-08-05',
      endDate: '2026-08-05'
    });
  });

  it('no lanza excepción con valores inválidos', () => {
    expect(() => buildGroup('no-es-una-fecha', 'tampoco-es-una-fecha')).not.toThrow();
    const group = buildGroup('no-es-una-fecha', 'tampoco-es-una-fecha');
    expect(group.errors?.['dateRange']).toBeUndefined();
  });

  it('no elimina los errores required de los controles individuales', () => {
    const group = buildGroup('', '');
    expect(group.get('startDate')?.errors?.['required']).toBeTruthy();
    expect(group.get('endDate')?.errors?.['required']).toBeTruthy();
  });
});
