import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../models/product';

/*
Tela do painel do administrador, somente visual (ainda sem funcionalidade).

styleUrl aponta para dois arquivos: o home.css reaproveita todo o visual da Home
(header, banner, cards, rodapé) e o panel-adm.css adiciona só o que é exclusivo do painel.
*/
@Component({
  selector: 'app-panel-adm',
  imports: [CurrencyPipe],
  templateUrl: './panel-adm.html',
  styleUrls: ['../home/home.css', './panel-adm.css'],
})
export class PanelAdm {
  // Dados fixos só para preencher a tela; depois virão do backend.
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
}
