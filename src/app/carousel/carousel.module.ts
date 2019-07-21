import { NgModule, ModuleWithProviders, Optional, SkipSelf } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CarouselItemComponent } from "./carousel-item/carousel-item.component";
import { CarouselComponent } from "./carousel.component";
import { CarouselItemDirective } from "./carousel-item.directive";
import { CarouselButton } from "./carousel-button.directive";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    CarouselItemComponent, 
    CarouselComponent,
    CarouselItemDirective,
    CarouselButton
  ],
  exports: [
    CarouselItemComponent,
    CarouselComponent,
    CarouselItemDirective,
    CarouselButton,
  ]
})
export class CarouselModule {
}