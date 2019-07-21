import { Component, Input, ContentChildren, QueryList, ElementRef, ViewEncapsulation, ViewChild, Output, EventEmitter, Renderer2 } from "@angular/core";
import { Subscription, fromEvent } from "rxjs";
import { debounceTime } from "rxjs/operators";

import { CarouselItemComponent } from "./carousel-item/carousel-item.component";
import { CarouselButton } from "./carousel-button.directive";
import { ICarouselService } from "./carousel-service.interface";

import { isIE } from "./ie-detect";

export type Direction = "horiz" | "vert";
export type Dimension = "width" | "height";

// TO-DO:
// Slide according to current width
// Fix buttons not rendering due to async loading of images 
@Component({
  selector: "app-carousel",
  templateUrl: "./carousel.component.html",
  styleUrls: ["./carousel.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class CarouselComponent {

  currentIndex: number = 0;
  private _autoPlayCancellationToken: any;
  private _windowKeyUpSubscription: Subscription;

  constructor(
    private readonly ref: ElementRef,
    private readonly rend: Renderer2
  ) { }

  @Input('direction')
  direction: Direction = "horiz";

  @Input("interval")
  interval: number = 2000;

  @Input('height')
  carouselHeight: string;

  @Input('width')
  carouselWidth: string;

  @Input("slideBy")
  slideBy: number = 1;

  @Input("autoPlay")
  isAutoPlayEnabled: boolean;

  // This property works only if autoPlay is enabled by user
  @Input("pauseOnHover")
  pauseOnHover: boolean;

  @Output("onload")
  onCarouselLoaded = new EventEmitter<CarouselComponent>();

  @ViewChild("carouselContainer")
  carouselContainer: ElementRef<any>;

  @ViewChild("carouselCore")
  carouselCore: ElementRef<any>;

  @ViewChild('carouselItemsContainer')
  carouselItemsContainer: ElementRef<any>;

  @ContentChildren(CarouselItemComponent)
  carouselItems: QueryList<CarouselItemComponent>;

  @ContentChildren(CarouselButton)
  carouselButtons: QueryList<CarouselButton>;

  private carouselItemsArray: CarouselItemComponent[];

  private totalCarouselItemsLoaded: number = 0;

  private handleKeyUp(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowRight":
        this.next();
        break;
      case "ArrowLeft":
        this.previous();
        break;
    }
  }

  private handleCaoruselItemLoaded() {
    this.totalCarouselItemsLoaded++;
    if (this.totalCarouselItemsLoaded === this.carouselItems.length) {
      this.onCarouselItemsLoaded();
      this.onCarouselLoaded.emit(this);
    }
  }

  ngOnInit() {
    this.isAutoPlayEnabled = this.isAutoPlayEnabled !== undefined;
    this.pauseOnHover = this.pauseOnHover !== undefined;

    this.handleKeyUp = this.handleKeyUp.bind(this);
    this._windowKeyUpSubscription = fromEvent(window, "keyup").pipe(
      debounceTime(200)
    ).subscribe(this.handleKeyUp)
  }

  ngAfterContentInit() {
    this.carouselItemsArray = this.carouselItems.toArray();

    this.carouselItems.forEach((item) => {
      item.itemLoaded.subscribe(() => this.handleCaoruselItemLoaded());
    });

    // using setTimeout to prevent content changed after checked error, try out some other possibilities 
    setTimeout(() => {
      const service: ICarouselService = {
        next: this.next.bind(this),
        previous: this.previous.bind(this),
        play: this.play.bind(this),
        pause: this.pause.bind(this),
        stop: this.stop.bind(this),
      };

      this.carouselItems.forEach(item => {
        // using property injection instead of contructor
        item.service = service;
        item.direction = this.direction;
        
        if (this.pauseOnHover) {
          this.rend.listen(item.elRef.nativeElement, "mouseenter", () => this.stop());
          this.rend.listen(item.elRef.nativeElement, "mouseleave", () => {
            if (this.isAutoPlayEnabled) this.play();
          });
        }
      });

      this.carouselButtons.forEach(button => button.service = service);
    });
  }

  ngOnDestroy() {
    if (this._autoPlayCancellationToken) clearInterval(this._autoPlayCancellationToken);
    if (this._windowKeyUpSubscription) this._windowKeyUpSubscription.unsubscribe();
  }


  private getDimension(): Dimension {
    let dimension: Dimension;

    switch (this.direction) {
      case "horiz":
        dimension = "width";
        break;
      case "vert":
        dimension = "height";
        break;
      default:
        throw new Error("NotImplementedException");
    }
    return dimension;
  }

  private areItemsVisible(start: number, numOfItems: number) {
    const dimension = this.getDimension();

    const carouselDimension = (this.carouselCore.nativeElement as HTMLElement).getBoundingClientRect()[dimension];

    let totalItemsDimension: number = 0;

    for (let i = start; i < numOfItems; i++) {
      totalItemsDimension += (this.carouselItemsArray[i].elRef.nativeElement as HTMLElement).getBoundingClientRect()[dimension];
    }

    return carouselDimension > totalItemsDimension;
  }

  private areAllItemsVisible(): boolean {
    return this.areItemsVisible(0, this.carouselItems.length);
  }

  countPreviousItems() {
    return Math.max(0, this.currentIndex);
  }

  private shouldSlide(): boolean {
    if (!this.carouselItemsArray || !this.carouselItemsArray.length) {
      console.warn("carousel item list is empty!")
      return false;
    }

    if (this.areAllItemsVisible()) {
      console.log("No need to slide, all items are visible!");
      return false;
    }

    return true;
  }

  private getItemsWidthSum(): number {
    return this.carouselItemsArray.reduce((sum, item) => {
      const width = (item.elRef.nativeElement as HTMLElement).getBoundingClientRect()[this.getDimension()];
      return sum + width;
    }, 0);
  }

  // TO-DO: Make it shorter and more cleaner
  public next() {
    if (!this.shouldSlide()) return;

    const countVisibleItems = (): number => {
      if (this.areAllItemsVisible()) return this.carouselItems.length;

      const dimension = this.getDimension();

      const carouselDimension = (this.carouselCore.nativeElement as HTMLElement).getBoundingClientRect()[dimension];
      let counter = this.currentIndex;
      let itemsDimension = 0;

      while (itemsDimension < carouselDimension && counter < this.carouselItems.length) {
        itemsDimension += (this.carouselItemsArray[counter].elRef.nativeElement as HTMLElement).getBoundingClientRect()[dimension];
        counter++;
      }
      return Math.max(0, counter - this.currentIndex - 1);
    }

    const countNextItems = (): number => {
      let numOfVisibleItems = countVisibleItems();
      return this.carouselItems.length - (this.currentIndex + numOfVisibleItems);
    }

    // const offset = (100 / this.carouselItems.length) * (this.currentIndex + this.slideBy >= this.carouselItems.length - 1 ? this.currentIndex = 0 : this.currentIndex += this.slideBy);
    let numOfItemsToShow = 0;
    if (this.areItemsVisible(this.currentIndex, this.carouselItems.length) || (this.currentIndex + this.slideBy > (this.carouselItems.length - 1))) {
      this.currentIndex = 0;
    } else {
      // multiplier should be less than or equal to slideBy
      let multiplier: number = this.slideBy;
      const numOfNextItems: number = countNextItems();
      if (numOfNextItems < this.slideBy) {
        multiplier = numOfNextItems;
      }
      numOfItemsToShow = this.currentIndex += multiplier;
    }
    const container = (this.carouselItemsContainer.nativeElement as HTMLElement);

    const offsetPercentage = (100 / this.carouselItems.length) * numOfItemsToShow;
    let totalsItemsWidth: number = this.getItemsWidthSum();
    const offset = (offsetPercentage * totalsItemsWidth) / 100;
    // console.log(`sliding from item ${this.currentIndex === 0 ? this.carouselItems.length - 1 : this.currentIndex - 1} to item ${this.currentIndex}`);
    if (this.direction === "horiz") {
      if(isIE()) {
        // for browser compatibility, support for IE 10
        container.style.transform = `translate(-${offset}px, 0)`;
      } else {
        container.style.transform = `translate(-${offsetPercentage}%, 0)`;
      }
    } else if (this.direction === "vert") {
      container.style.transform = `translate(0, -${offsetPercentage}%)`;
    } else {
      console.warn("CarouselComponent.next(): unknown direction!");
    }
  }
  
  // TO-DO: Make it shorter and more cleaner
  public previous() {
    if (!this.shouldSlide()) return;

    const countItemsFromLast = (): number => {
      let [counter, itemsDimesionSum, index] = [0, 0, this.carouselItems.length - 1];
      const dimension = this.getDimension();
      const carouselDimension = (this.carouselCore.nativeElement as HTMLElement).getBoundingClientRect()[dimension];
      while (itemsDimesionSum < carouselDimension && index >= 0) {
        itemsDimesionSum += (this.carouselItemsArray[counter].elRef.nativeElement as HTMLElement).getBoundingClientRect()[dimension];
        index--;
        counter++;
      }
      return counter - 1;
    };

    let numOfItemsToShow = 0;
    // when currentIndex - slideBy  < 0 then its an overflow 
    if (this.countPreviousItems() < 1 && this.currentIndex - this.slideBy < 0) {
      numOfItemsToShow = this.currentIndex = this.carouselItems.length - countItemsFromLast();
    } else {
      // multiplier should be less than or equal to slideBy
      let multiplier: number = this.slideBy;
      const numOfNextItems: number = this.countPreviousItems();
      if (numOfNextItems < this.slideBy) {
        multiplier = numOfNextItems;
      }
      numOfItemsToShow = this.currentIndex -= multiplier;
    }

    // const offset = (100 / this.carouselItems.length) * (this.currentIndex === 0 ? (this.currentIndex = this.carouselItems.length - 1) : --this.currentIndex);
    const offsetPercentage = (100 / this.carouselItems.length) * numOfItemsToShow;
    let totalsItemsWidth: number = this.getItemsWidthSum();
    const offset = (offsetPercentage * totalsItemsWidth) / 100;

    const container = (this.carouselItemsContainer.nativeElement as HTMLElement);

    if (this.direction === "horiz") {
      if(isIE()) {
        // for browser compatibility, support for IE 10
        container.style.transform = `translate(-${offset}px, 0)`;
      } else {
        container.style.transform = `translate(-${offsetPercentage}%, 0)`;
      }
    } else if (this.direction === "vert") {
      container.style.transform = `translateY(-${offset}%)`;
    } else {
      console.warn("CarouselComponent.next(): unknown direction!");
    }
  }

  public play() {
    if (this.carouselItems.length < 1) {
      console.log("carousel items list empty!");
      return;
    }
    // if carousel is already playing then no need to play again and just simply return
    if (this._autoPlayCancellationToken) return;

    this._autoPlayCancellationToken = setInterval(() => {
      this.next();
    }, this.interval);
  }

  public pause() {
    if (this._autoPlayCancellationToken) {
      clearInterval(this._autoPlayCancellationToken);
      this._autoPlayCancellationToken = null;
    }
  }

  public stop() {
    this.pause();
  }

  public autoPlay() {
    this.isAutoPlayEnabled = true;
    this.play();
  }

  // not in use for now
  private centerCarousel() {
    //### center carousel ###
    const itemsContainerWidth = this.carouselItemsArray.reduce((totalWidth, item) => (item.elRef.nativeElement as HTMLElement).getBoundingClientRect().width + totalWidth, 0);

    this.rend.setStyle(this.carouselCore.nativeElement, "padding-left", `calc(50% - ${itemsContainerWidth * 0.5}px)`);
    //#############################
  }

  private onCarouselItemsLoaded() {
    // buttons are hidden by default and show only if all items are not visible on viewport
    if (!this.areAllItemsVisible())
      this.carouselButtons.forEach(button => button.show());
    // ######################################################################

    if (this.isAutoPlayEnabled) {
      this.play();
    }
  }

}