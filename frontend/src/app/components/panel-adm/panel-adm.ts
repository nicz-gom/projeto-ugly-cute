import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryResponse, CategoryService } from '../../services/category.service';
import { AdminProduct, ProductsService } from '../../services/products.service';
// FormBuilder: "fábrica" que cria o formulário com sintaxe curta (usado no .ts).
// ReactiveFormsModule: ensina o HTML a entender [formGroup], formControlName e (ngSubmit).
// Validators: regras prontas de validação (required, min, email, minLength...).
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

/*
Tela do painel do administrador.

styleUrl aponta para dois arquivos: o home.css reaproveita todo o visual da Home
(header, banner, cards, rodapé) e o panel-adm.css adiciona só o que é exclusivo do painel.
*/
@Component({
  selector: 'app-panel-adm',
  // Componente standalone: declara tudo o que o template usa. Sem o ReactiveFormsModule,
  // o Angular acusa "Can't bind to 'formGroup' since it isn't a known property of 'form'".
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './panel-adm.html',
  styleUrls: ['../home/home.css', './panel-adm.css'],
})
export class PanelAdm {
  private readonly categoryService = inject(CategoryService);
  private readonly productsService = inject(ProductsService);
  // Pede ao Angular uma instância do FormBuilder, como os services acima.
  // Precisa vir ANTES do productForm: as propriedades são criadas de cima para baixo,
  // e o productForm usa this.fb na própria criação.
  private readonly fb = inject(FormBuilder);

  /*
  productForm: o FormGroup do cadastro. Agrupa os campos e sabe dizer se o conjunto
  está válido (productForm.invalid), quais valores tem (getRawValue()) e quais campos foram tocados.

  .nonNullable: o reset() volta cada campo ao valor INICIAL ('' / 0) em vez de null,
  e o TypeScript tipa name como string, e não string | null.

  Formato de cada campo -> nome: [valorInicial, { validators: [regras] }]
  - A chave (name, price...) é o mesmo nome usado no formControlName do HTML.
  - O valor inicial define o TIPO do campo: price: [0] vira number, por isso o postProduct aceita.

  As regras repetem as do zod no backend de propósito: o front valida para AJUDAR o usuário
  (avisa antes de enviar); o back valida para se PROTEGER (alguém pode chamar a API sem a tela).
  */
  readonly productForm = this.fb.nonNullable.group({
    name: ['', { validators: [Validators.required] }], // obrigatório; no zod: z.string().min(1)
    price: [0, { validators: [Validators.required, Validators.min(0.01)] }], // min(0.01) recusa zero e negativo, como o .positive() do zod
    image: ['', { validators: [Validators.required] }], // nome do arquivo em assets; no banco é String (sem ?), então obrigatório
    categoryId: [0, { validators: [Validators.required, Validators.min(1)] }], // "Selecione..." vale 0 e o min(1) o recusa; toda categoria real tem id >= 1
    description: [''], // sem validação: no banco é String? (opcional)
    active: [true], // checkbox "Produto ativo": começa marcado, como o @default(true) do banco
  });

  // #region Produtos

  readonly products = signal<AdminProduct[]>([]);
  readonly productsLoading = signal(true);
  readonly productsError = signal('');
  // true enquanto o POST está em andamento: desabilita o botão (evita cadastro duplicado
  // num clique duplo) e troca o texto para "Salvando...". Mesmo papel do savingCategory.
  readonly savingProduct = signal(false);
  // Mensagem de erro vinda do backend; '' = sem erro, e o @if do HTML não mostra nada.
  readonly productError = signal('');

  // computed: recalcula sozinho sempre que o signal products mudar.
  readonly activeCount = computed(() => this.products().filter((p) => p.active).length);
  readonly inactiveCount = computed(() => this.products().length - this.activeCount());

  loadProducts(): void {
    this.productsLoading.set(true);
    this.productsError.set('');

    this.productsService.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.productsLoading.set(false);
      },
      error: () => {
        this.productsLoading.set(false);
        this.productsError.set('Não foi possível carregar os produtos. Verifique se o backend está rodando.');
      },
    });
  }

  /** O produto só guarda o categoryId; o nome vem da lista de categorias já carregada. */
  categoryName(categoryId: number): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? 'Sem categoria';
  }

  // #region Edição

  // id do produto em edição; null = o formulário está no modo cadastro.
  readonly editingProductId = signal<number | null>(null);
  readonly isEditing = computed(() => this.editingProductId() !== null);

  /** Botão "Editar" do card: copia o produto para o formulário e rola a tela até ele. */
  startEdit(product: AdminProduct): void {
    this.editingProductId.set(product.id);
    this.productError.set('');

    // setValue exige TODOS os campos do form; description pode vir null do banco, e o form só aceita string.
    this.productForm.setValue({
      name: product.name,
      price: product.price,
      image: product.image,
      categoryId: product.categoryId,
      description: product.description ?? '',
      active: product.active,
    });

    document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' });
  }

  /** Sai do modo edição (ou só limpa, se já estiver no cadastro). */
  cancelEdit(): void {
    this.editingProductId.set(null);
    this.productError.set('');
    this.productForm.reset();
  }

  // #endregion

  /** Chamado pelo (ngSubmit) do formulário: cadastra (POST) ou salva a edição (PUT). */
  saveProduct(): void {
    // 1. Form inválido: marca todos os campos como tocados (para os erros aparecerem) e não envia nada.
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.productError.set('Preencha nome, preço, categoria e imagem.');
      return;
    }

    // 2. getRawValue() devolve { name, price, image, categoryId, description, active } já tipado.
    const data = this.productForm.getRawValue();

    // 3. Liga o "Salvando..." e apaga um erro anterior.
    this.savingProduct.set(true);
    this.productError.set('');

    // 4. Com id em edição faz PUT; sem id faz POST. Os dois devolvem Observable<AdminProduct>,
    //    então o mesmo subscribe serve para os dois. A requisição só sai no subscribe(),
    //    e o interceptor coloca o token no cabeçalho sozinho.
    const editingId = this.editingProductId();
    const request$ =
      editingId === null
        ? this.productsService.postProduct(data)
        : this.productsService.putProduct(editingId, data);

    request$.subscribe({
      next: (saved) => {
        this.savingProduct.set(false);

        if (editingId === null) {
          // Cadastro: novo produto no INÍCIO da lista (o spread cria um array novo e o signal avisa a tela).
          this.products.update((list) => [saved, ...list]);
        } else {
          // Edição: troca só o produto alterado, mantendo a posição dele na lista.
          this.products.update((list) => list.map((p) => (p.id === saved.id ? saved : p)));
        }

        // Volta ao modo cadastro com o form limpo (nonNullable: '' / 0 / true, não null).
        this.cancelEdit();
      },
      error: (err: HttpErrorResponse) => {
        this.savingProduct.set(false);
        // 401 = sem token ou token vencido; 400 = o zod recusou os dados (vem uma lista, sem "message").
        this.productError.set(
          err.status === 401
            ? 'Sua sessão não é válida. Faça login novamente.'
            : err.status === 400
              ? 'Dados inválidos. Confira os campos e tente de novo.'
              : 'Não foi possível salvar o produto.',
        );
      },
    });
  }

  // #region Exclusão

  // Produto aguardando confirmação; null = modal fechado. O @if (...; as product) do HTML usa isso.
  readonly productToDelete = signal<AdminProduct | null>(null);
  readonly deletingProduct = signal(false);
  readonly deleteError = signal('');

  /** Botão "Excluir" do card: só abre a confirmação, não apaga nada ainda. */
  askDelete(product: AdminProduct): void {
    this.deleteError.set('');
    this.productToDelete.set(product);
  }

  closeDeleteModal(): void {
    this.productToDelete.set(null);
  }

  /** Botão "Excluir" do modal: aqui sim chama o DELETE. */
  confirmDelete(): void {
    const product = this.productToDelete();
    if (!product) return;

    this.deletingProduct.set(true);
    this.deleteError.set('');

    this.productsService.deleteProduct(product.id).subscribe({
      next: () => {
        this.deletingProduct.set(false);
        // filter devolve um array novo sem o produto excluído.
        this.products.update((list) => list.filter((p) => p.id !== product.id));
        // Se o produto excluído estava aberto no formulário, sai do modo edição.
        if (this.editingProductId() === product.id) {
          this.cancelEdit();
        }
        this.closeDeleteModal();
      },
      error: (err: HttpErrorResponse) => {
        this.deletingProduct.set(false);
        this.deleteError.set(
          err.status === 401
            ? 'Sua sessão não é válida. Faça login novamente.'
            : 'Não foi possível excluir o produto.',
        );
      },
    });
  }

  // #endregion

  // #endregion

  // #region Categorias

  readonly categories = signal<CategoryResponse[]>([]);

  // Estado do modal de nova categoria
  readonly isCategoryModalOpen = signal(false);
  readonly newCategoryName = signal('');
  readonly categoryError = signal('');
  readonly savingCategory = signal(false);

  constructor() {
    // Busca produtos e categorias assim que o painel é criado.
    this.loadProducts();
    this.categoryService.getCategories().subscribe((list) => this.categories.set(list));
  }

  openCategoryModal(): void {
    this.newCategoryName.set('');
    this.categoryError.set('');
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
  }

  saveCategory(): void {
    const name = this.newCategoryName().trim();

    if (!name) {
      this.categoryError.set('Informe o nome da categoria.');
      return;
    }

    this.savingCategory.set(true);
    this.categoryError.set('');

    this.categoryService.postCategory({ name }).subscribe({
      next: (created) => {
        this.savingCategory.set(false);
        // Adiciona a nova categoria na lista mantendo a ordem alfabética, sem buscar tudo de novo.
        this.categories.update((list) =>
          [...list, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        this.closeCategoryModal();
      },
      error: (err: HttpErrorResponse) => {
        this.savingCategory.set(false);
        // 401 = sem token (falta o interceptor ou o login expirou); 409 = nome repetido.
        this.categoryError.set(
          err.status === 401
            ? 'Sua sessão não é válida. Faça login novamente.'
            : err.error?.message ?? 'Não foi possível salvar a categoria.',
        );
      },
    });
  }

  /*
  categories: lista vinda do GET /api/categories, usada no @for do <select>.

  categories.update(...): como set(), mas recebe o valor atual e devolve o novo. O spread [...list]
  cria um array novo; alterar o array antigo com push() não avisaria o signal da mudança.

  localeCompare: compara textos respeitando acentos, então "Árvore" fica perto de "Arco", e não no fim.
  */

  // #endregion
}
