import { FormControl } from '@angular/forms';
import { notFutureDateValidator } from './not-future-date.validator';

describe('notFutureDateValidator', () => {
  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('acepta un valor vacío', () => {
    const control = new FormControl('', notFutureDateValidator());
    expect(control.errors).toBeNull();
  });

  it('acepta una fecha pasada', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 6, 15));

    const control = new FormControl('2026-07-01', notFutureDateValidator());
    expect(control.errors).toBeNull();
  });

  it('acepta la fecha actual', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 6, 15));

    const control = new FormControl('2026-07-15', notFutureDateValidator());
    expect(control.errors).toBeNull();
  });

  it('rechaza una fecha futura', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 6, 15));

    const control = new FormControl('2026-07-16', notFutureDateValidator());
    expect(control.errors?.['futureDate']).toEqual({
      selectedDate: '2026-07-16',
      maximumDate: '2026-07-15'
    });
  });

  it('no depende de una fecha hardcodeada: se ajusta según la fecha del sistema', () => {
    jasmine.clock().install();

    jasmine.clock().mockDate(new Date(2020, 0, 10));
    expect(new FormControl('2020-01-11', notFutureDateValidator()).errors?.['futureDate']).toBeTruthy();
    expect(new FormControl('2020-01-09', notFutureDateValidator()).errors).toBeNull();

    jasmine.clock().mockDate(new Date(2030, 5, 20));
    expect(new FormControl('2030-06-21', notFutureDateValidator()).errors?.['futureDate']).toBeTruthy();
    expect(new FormControl('2030-06-19', notFutureDateValidator()).errors).toBeNull();
  });

  it('no falla por diferencias de zona horaria al comparar solo el día calendario', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 6, 15, 23, 45));

    const control = new FormControl('2026-07-15', notFutureDateValidator());
    expect(control.errors).toBeNull();
  });

  it('no lanza excepción con valores inválidos', () => {
    expect(() => new FormControl('no-es-una-fecha', notFutureDateValidator())).not.toThrow();
    expect(new FormControl('no-es-una-fecha', notFutureDateValidator()).errors).toBeNull();
  });
});
