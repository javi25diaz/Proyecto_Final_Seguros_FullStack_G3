import { Injectable } from '@angular/core';
import { Payment } from '../models/payment.model';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class PaymentService extends CrudService<Payment> {
  protected readonly resourcePath = 'payments';
}
