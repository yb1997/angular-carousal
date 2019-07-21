import { Directive, Input, ElementRef, Renderer2, HostBinding } from "@angular/core";
import { fromEvent } from "rxjs";
import { debounceTime, } from "rxjs/operators";
import { ICarouselService } from "./carousel-service.interface";
import { isIE } from "./ie-detect";

@Directive({
  selector: "[carouselBtn]"
})
export class CarouselButton {
  public service: ICarouselService;

  constructor(
    private elRef: ElementRef<any>,
    private readonly rend: Renderer2
  ) { }

  @Input('navigation')
  navigation: "next" | "previous" | "play" | "pause" | "stop";

  @HostBinding('style.display')
  display: "initial" | "none" | "";

  ngOnInit() {
    fromEvent(this.elRef.nativeElement, "click").pipe(
      debounceTime(200),
      // switchMap()
    ).subscribe(() => {
        if (!this.service) {
          console.error("Service has not been attached by carousel!");
          return;
        }

        switch (this.navigation) {
          case "next":
            this.service.next();
            break;
          case "previous":
            this.service.previous();
            break;
          case "play":
            this.service.play();
            break;
          case "pause":
            this.service.pause();
            break;
          case "stop":
            this.service.stop();
            break;
          default:
            console.warn("provided navigation type isn't supported!, Please provide valid 'navigation' input property");
            break;
        }  
    });

    this.display = "none";
  }

  public hide() {
    this.display = "none";
  }

  public show() {
    this.display = isIE() ? "" : "initial";
  }

}
