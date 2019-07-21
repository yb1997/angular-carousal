import { Directive, Renderer2 } from "@angular/core";

@Directive({ 
  selector: "[carouselItem]"
})
export class CarouselItemDirective {
  constructor(
    private readonly _rend: Renderer2
  ) {}

  public direction: "horiz" | "vert";

  ngOnInit() {
    console.log(this.direction);
  }


}