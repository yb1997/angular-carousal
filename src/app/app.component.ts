import { Component, ViewChild } from '@angular/core';
import { CarouselComponent } from "./carousel/carousel.component";

export type CardContent = { imagePath: string, text: string }

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  direction = "horiz";

  @ViewChild('carousel')
  carousel: CarouselComponent;

  itemsList: CardContent[];

  ngOnInit() {
    this.itemsList = Array(10).fill(0).map(x => ({ imagePath: "//unsplash.it/200/200", text: "This is carousel item" }));
  }
  
}
