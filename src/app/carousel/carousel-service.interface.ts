export interface ICarouselService {
  next: () => void;
  previous: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}