import { AfterViewInit, Component, ElementRef, OnDestroy, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../models/product';

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

/*

@Component
Define o componente <app-home>.

Importa o CurrencyPipe para formatar valores monetários no HTML.

Vincula os arquivos de template (home.html) e estilo (home.css).

/* 

//Tipo: onShow
AfterViewInit: Executado logo após o Angular inicializar e renderizar completamente a view do componente (DOM) e de 
seus componentes filhos. É ideal para manipular elementos da tela que já foram carregados.

//Tipo: onDestroy
OnDestroy: Executado imediatamente antes de o componente ser destruído pelo Angular. É utilizado para tarefas de limpeza, como cancelar 
inscrições de Observables, remover event listeners ou limpar timers, evitando vazamento de memória.
*/

export class Home implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    const filterButton = this.host.nativeElement.querySelector('.filter') as HTMLElement | null;
    const filterMenu = this.host.nativeElement.querySelector('.filter-options') as HTMLElement | null;

    if (!filterMenu || !filterButton || !target) {
      return;
    }

    const clickedInsideFilter = filterMenu.contains(target) || filterButton.contains(target);

    if (!clickedInsideFilter) {
      this.closeFilterMenu();
    }
  };

  searchTerm = '';
  selectedFilters: string[] = [];
  isFilterMenuOpen = false;

  /* 
  private readonly host = inject(ElementRef<HTMLElement>);
  Injeta a referência direta do elemento DOM no qual o componente ou diretiva está instanciado. 
  O uso de private readonly garante que só pode ser acessado dentro da classe e não pode ter seu valor sobrescrito 
  após a inicialização. 
*/

  private revealObserver?: IntersectionObserver;

  /*
  private revealObserver?: IntersectionObserver;
  Declara uma propriedade opcional (?) para armazenar um observador nativo do navegador 
  (IntersectionObserver). É tipicamente utilizado para detectar quando o elemento entra ou sai da área visível da tela
  (viewport).
  */

  private noticeTimeout?: ReturnType<typeof setTimeout>;

  msgDefault: string = 'Olá, gostaria de fazer um pedido.';
  number: string = '553299232498';
  url = `https://api.whatsapp.com/send?phone=${this.number}&text=${encodeURIComponent(this.msgDefault)}`;

  /*
  private noticeTimeout?: ReturnType<typeof setTimeout>;
  Declara uma propriedade opcional para armazenar a referência de um temporizador. O ReturnType<typeof setTimeout> é uma 
  boa prática que garante o tipo correto do retorno (evitando conflitos de tipagem entre ambientes como Node.js e o Browser).
  */

  /* EXPLICAÇÃO BREVE
  host: Injeta o elemento DOM raiz do componente para manipulação direta.

  revealObserver: Instância do IntersectionObserver para detectar quando os elementos entram na tela.

  noticeTimeout: Guarda a referência do temporizador (setTimeout) da notificação para permitir seu cancelamento.
  */

  whatsappDefault(){
    this.url = `https://api.whatsapp.com/send?phone=${this.number}&text=${encodeURIComponent(this.msgDefault)}`;

    window.open(this.url, '_blank');
  }

  // #region Catálogo e carrinho

  readonly products: Product[] = [
    new Product(1, 'Elaris', 15, '01_Elaris_site.png'),
    new Product(2, 'Niméia', 18, '02_Niméia_site.png'),
    new Product(3, 'Fênix', 21, '03_Fênix_site.png'),
    new Product(4, 'Aeris', 17, '04_Aeris_site.png'),
    new Product(5, 'Moss', 19, '05_Moss_site.png'),
    new Product(6, 'Floren', 20, '06_Floren_site.png'),
    new Product(7, 'Líria', 16, '07_Líria_site.png'),
    new Product(8, 'Lunar', 22, '08_Lunar_site.png'),
    new Product(9, 'Outon', 18, '09_Outon_site.png'),
    new Product(10, 'Nox', 23, '10_Nox_site.png'),
  ];

  /** Armazena somente os produtos que o cliente adicionou ao carrinho. */
  readonly cart: Product[] = [];

  isCartOpen = false;

  readonly cartNotice = signal('');

  get cartItemsCount(): number {
    return this.cart.reduce((total, product) => total + product.quantity, 0);
  }

  /**
   products: Array fixo contendo os 10 produtos disponíveis para venda.

   cart: Array que armazena apenas os itens selecionados pelo usuário.

   isCartOpen: Booleano que controla a exibição do painel lateral do carrinho.

   cartNotice: Um signal do Angular (variável reativa) que guarda a mensagem temporária de "Produto adicionado".

   cartItemsCount e cartTotal (Getters): Calculam dinamicamente a quantidade total de peças e o valor financeiro total do carrinho usando o método reduce().
   */

  get cartTotal(): number {
    return this.cart.reduce((total, product) => total + product.price * product.quantity, 0);
  }

  get filteredProducts(): Product[] {
    const normalizedSearch = (this.searchTerm ?? '').trim().toLowerCase();
    const baseProducts =
      this.selectedFilters.length === 0
        ? [...this.products]
        : this.products.filter((product) => this.selectedFilters.includes(product.name));

    if (!normalizedSearch) {
      return baseProducts;
    }

    return baseProducts.filter((product) =>
      product.name.toLowerCase().includes(normalizedSearch),
    );
  }

  toggleFilterMenu(): void {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  closeFilterMenu(): void {
    this.isFilterMenuOpen = false;
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value ?? '';
  }

  onFilterChange(productName: string, checked: boolean): void {
    if (checked) {
      this.selectedFilters = [...new Set([...this.selectedFilters, productName])];
      return;
    }

    this.selectedFilters = this.selectedFilters.filter((name) => name !== productName);
  }

  addToCart(product: Product): void {
    const cartProduct = this.cart.find((item) => item.id === product.id);

    if (cartProduct) {
      cartProduct.quantity++;
      this.showCartNotice(`Quantidade de ${product.name} atualizada no carrinho.`);
      return;
    }

    // Cria uma cópia para que a quantidade do catálogo não seja alterada.
    this.cart.push(new Product(product.id, product.name, product.price, product.image));
    this.showCartNotice(`${product.name} foi adicionado ao carrinho.`);
  }

  changeQuantity(product: Product, change: number): void {
    product.quantity += change;

    if (product.quantity <= 0) {
      this.removeFromCart(product);
    }
  }

  removeFromCart(product: Product): void {
    const productIndex = this.cart.findIndex((item) => item.id === product.id);

    if (productIndex !== -1) {
      this.cart.splice(productIndex, 1);
    }
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  private showCartNotice(message: string): void {
    clearTimeout(this.noticeTimeout);
    this.cartNotice.set(message);
    this.noticeTimeout = setTimeout(() => this.cartNotice.set(''), 1200);
  }

  /*
  addToCart(product): Busca o produto no carrinho. Se já existir, incrementa a quantidade. Se não, adiciona uma nova instância (para não alterar o produto original do catálogo). Dispara o aviso visual.

  changeQuantity(product, change): Aumenta ou diminui a quantidade de um item no carrinho. Se o valor for menor ou igual a zero, remove o item.

  removeFromCart(product): Localiza a posição do item no array cart e o exclui usando splice().

  toggleCart(): Alterna o estado de isCartOpen entre true e false.

  showCartNotice(message): Exibe a mensagem de notificação atualizando o signal e configura um setTimeout de 1200ms (1.2s) para limpá-la. O clearTimeout prévio garante que cliques rápidos não sobreponham os tempos.
  */

  // #endregion

  // #region Efeito Animação Fluida Página 

  ngAfterViewInit(): void {
    document.addEventListener('click', this.handleDocumentClick);

    // Executa depois que o HTML do componente foi renderizado. Assim, todos os
    // elementos marcados com data-reveal já podem ser encontrados no DOM.
    const revealItems = (this.host.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-reveal]');

    // Fallback para navegadores que não oferecem IntersectionObserver:
    // deixa todo o conteúdo visível para que ele não fique oculto na tela.
    if (typeof IntersectionObserver === 'undefined') {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    // O observer acompanha quando cada elemento entra na área visível da tela.
    // threshold: 0.14 significa que a animação começa ao menos 14% visível.
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // A classe dispara a transição CSS de opacidade e deslocamento.
            entry.target.classList.add('is-visible');

            // Após aparecer uma vez, o item não precisa mais ser observado.
            // Isso evita executar o observer novamente ao rolar a página.
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    // Inicia o monitoramento de todos os elementos que devem aparecer ao rolar.
    revealItems.forEach((item) => this.revealObserver?.observe(item));
  }

  ngOnDestroy(): void {
    // Remove o observer quando o componente é destruído, prevenindo referências
    // desnecessárias ao DOM e possíveis vazamentos de memória.
    this.revealObserver?.disconnect();
    document.removeEventListener('click', this.handleDocumentClick);
    clearTimeout(this.noticeTimeout);
  }

  finishOrder(): void {
    let msgOrder: string = '';
    
    if (this.cart.length === 0) {
      this.showCartNotice('O carrinho está vazio. Adicione produtos antes de finalizar o pedido.');
      return;
    } 
    
    const moeda = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      msgOrder += 'Olá, gostaria de fazer um pedido:\n\n';
      msgOrder += '━━━━━━━━━━━━━━━━\n\n';

      for (const product of this.cart) {
        const subtotal = product.price * product.quantity;

        msgOrder +=
          `*${product.name}*\n` +
          `Quantidade: ${product.quantity}\n` +
          `Preço unitário: ${moeda.format(product.price)}\n` +
          `Subtotal: ${moeda.format(subtotal)}\n\n`;
      }

      msgOrder +=
        '━━━━━━━━━━━━━━━━\n' +
        `*TOTAL: ${moeda.format(this.cartTotal)}*\n`;
      
      msgOrder += '*QUANTIDADE TOTAL DE ITENS: *' + this.cartItemsCount + '\n\n';

      msgOrder += '*Aguardo a confirmação. Obrigado!*\n';
        
      const whatsappUrl =
        `https://api.whatsapp.com/send?phone=${this.number}` +
        `&text=${encodeURIComponent(msgOrder)}`;

      window.open(whatsappUrl, '_blank');

      this.showCartNotice('Pedido enviado com sucesso!');
    }

}

// #endregion 


