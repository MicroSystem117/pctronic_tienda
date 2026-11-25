import type { PoolConnection } from 'mariadb';
import { NotFoundError } from '../../../shared/domain/app-error.js';
import type { CreateOrderInTxInput, SaleRepositoryPort } from '../domain/sale.repository.js';

export class SaleService {
  constructor(private readonly saleRepo: SaleRepositoryPort) {}

  createOrderInTx(conn: PoolConnection, input: CreateOrderInTxInput) {
    return this.saleRepo.createOrderInTx(conn, input);
  }

  async trackOrder(orderNumber: string, contact: string) {
    const found = await this.saleRepo.findTrackedOrder(orderNumber, contact);
    if (!found) {
      throw new NotFoundError('No encontramos un pedido con ese número');
    }
    return found;
  }

  listMyOrders(userId: number, email: string) {
    return this.saleRepo.listOrdersByUser(userId, email);
  }
}
