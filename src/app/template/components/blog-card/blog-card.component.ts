import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

// tarjetas de productos
interface productCards {
  id: number;
  imgSrc: string;
  title: string;
  price: string;
  rprice: string;
}

@Component({
  selector: 'app-blog-card',
  imports: [MatCardModule, TablerIconsModule, MatButtonModule],
  templateUrl: './blog-card.component.html',
})
export class AppBlogCardsComponent {
  productcards: productCards[] = [
    {
      id: 1,
      imgSrc: '/assets/images/products/product-1.jpg',
      title: 'Audífonos Boat',
      price: '285000',
      rprice: '375000',
    },
    {
      id: 2,
      imgSrc: '/assets/images/products/product-2.jpg',
      title: 'MacBook Air Pro',
      price: '285000',
      rprice: '375000',
    },
    {
      id: 3,
      imgSrc: '/assets/images/products/product-3.jpg',
      title: 'Vestido rojo de terciopelo',
      price: '285000',
      rprice: '375000',
    },
    {
      id: 4,
      imgSrc: '/assets/images/products/product-4.jpg',
      title: 'Oso de peluche suave',
      price: '285000',
      rprice: '375000',
    },
  ];
}
