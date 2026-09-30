/** Representa um produto disponível para venda ou presente no carrinho. */
export class Product {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly price: number,
    public readonly image: string,
    public quantity = 1,
  ) {}
}
