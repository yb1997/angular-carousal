import { Component, ViewEncapsulation, ElementRef, ViewChild, Output, EventEmitter, ViewChildren, QueryList, AfterViewInit, Renderer2, ContentChildren, AfterContentInit } from "@angular/core";
import { ICarouselService } from "../carousel-service.interface";

@Component({
  selector: "carousel-Item",
  templateUrl: "./carousel-item.component.html",
  styleUrls: ["./carousel-item.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class CarouselItemComponent implements AfterContentInit {

  public direction: "horiz" | "vert";

  @Output("onload")
  itemLoaded = new EventEmitter<CarouselItemComponent>();


  @ViewChild('contentContainer')
  public contentContainer: ElementRef<any>;

  @ContentChildren("caroualItemImage", { descendants: true })
  contentImages: QueryList<ElementRef<HTMLImageElement>>;

  public service: ICarouselService;

  private numberOfImagesLoaded: number = 0;

  constructor(
    public readonly elRef: ElementRef,
    private readonly rend: Renderer2
  ) {}

  ngAfterContentInit(): void {
    if(!this.contentImages.length) {
      this.itemLoaded.emit(this);
      return;
    }
    this.handleImageLoad = this.handleImageLoad.bind(this);
    const events = ["load", "error"];
    this.contentImages.toArray().forEach(image => {
      events.forEach(event => {
        this.rend.listen(image.nativeElement, event, this.handleImageLoad)
      })
    });
  }

  handleImageLoad() {
    this.numberOfImagesLoaded++;
    if(this.numberOfImagesLoaded === this.contentImages.length) {
      console.log("all images loaded!");
      this.itemLoaded.emit(this);
    }
  }

}