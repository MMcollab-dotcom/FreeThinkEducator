function cubicBezier(t: number) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
  
  /**
   * This function will interpolate values from 0 to 1 over a given
   * animationDuration. At each time step, it will call the callback function with the
   * interpolated value. The number of timesteps is obtained from the browser, based on the
   * current frame rate.
   *
   * @param initialValue The value to initialize the state with.
   * @param finalValue The value to set the state to when the animation is complete.
   * @param startTime The time at which the animation should start.
   * @param animationDuration The duration of the animation.
   * @param callback The function to call at each time step with the animated value as a
   * parameter.
   * @param options Optional parameters.
   */
  export function animateTransition(
    startTime: number,
    animationDuration: number,
    // eslint-disable-next-line no-unused-vars
    callback: (progress: number) => void,
    options?: { easingFunction: 'cubic-bezier' | 'linear' },
  ) {
    const now = Date.now();
    const elapsedTime = now - startTime;
    const endTime = startTime + animationDuration;
    let progress = Math.min(1, Math.max(0, elapsedTime / (endTime - startTime)));
  
    if (options?.easingFunction === 'cubic-bezier') {
      progress = cubicBezier(progress);
    }
  
    callback(progress);
  
    if (now < endTime) {
      window.requestAnimationFrame(() =>
        animateTransition(startTime, animationDuration, callback, options),
      );
    }
  }
  


const GRID_SIZE = 10
const MIN_ZOOM_FACTOR = 0.001
const MAX_ZOOM_FACTOR = 2

/* eslint-disable no-empty-function */
export type baseCoordinate = number & { _coordinateType: 'base' };

export class BasePoint {
  x: baseCoordinate;
  y: baseCoordinate;

  constructor(x: number, y: number) {
    this.x = x as baseCoordinate;
    this.y = y as baseCoordinate;
  }

  alignToGrid() {
    this.x = Math.round(this.x) as baseCoordinate;
    this.y = Math.round(this.y) as baseCoordinate;
  }

  static add(p1: BasePoint, p2: BasePoint) {
    return new BasePoint(p1.x + p2.x, p1.y + p2.y);
  }

  static subtract(p1: BasePoint, p2: BasePoint) {
    return new BasePoint(p1.x - p2.x, p1.y - p2.y);
  }
}

export type VirtualCoordinate = number & { _coordinateType: 'virtual' };

export class VirtualGrid {
  // says how many pixels one base unit represent, i.e. 1 baseUnit = X pixels
  baseUnitToPixelRatio: number = GRID_SIZE;

  // eslint-disable-next-line no-use-before-define
  private static singleton: VirtualGrid;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {}

  static getSingleton(): VirtualGrid {
    const isSingletonInstantiated = Boolean(VirtualGrid.singleton);
    if (!isSingletonInstantiated) {
      VirtualGrid.singleton = new VirtualGrid();
    }

    return VirtualGrid.singleton;
  }

  convertToVirtual(baseCoord: baseCoordinate): VirtualCoordinate {
    return (baseCoord * this.baseUnitToPixelRatio) as VirtualCoordinate;
  }

  convertToBase(virtualCoord: VirtualCoordinate): baseCoordinate {
    return (virtualCoord / this.baseUnitToPixelRatio) as baseCoordinate;
  }
}

export class VirtualPoint {
  _basePoint: BasePoint;
  private static _defaultValue: VirtualCoordinate = 0 as VirtualCoordinate;

  constructor(x?: VirtualCoordinate, y?: VirtualCoordinate) {
    const virtualX: VirtualCoordinate = x ?? VirtualPoint._defaultValue;
    const virtualY: VirtualCoordinate = y ?? VirtualPoint._defaultValue;

    const virtualGrid = VirtualGrid.getSingleton();
    const baseX = virtualGrid.convertToBase(virtualX);
    const baseY = virtualGrid.convertToBase(virtualY);
    this._basePoint = new BasePoint(baseX, baseY);
  }

  static fromJSON(data: any) {
    let position = new VirtualPoint(0 as VirtualCoordinate, 0 as VirtualCoordinate);
    position = Object.assign(position, data);
    return position;
  }

  static fromBase(x: number, y: number) {
    const virtualPoint = new VirtualPoint();
    virtualPoint._basePoint.x = x as baseCoordinate;
    virtualPoint._basePoint.y = y as baseCoordinate;

    return virtualPoint;
  }

  get basePoint(): BasePoint {
    return this._basePoint;
  }

  set basePoint(newBasePoint: BasePoint) {
    this._basePoint.x = newBasePoint.x;
    this._basePoint.y = newBasePoint.y;
  }

  get x(): VirtualCoordinate {
    return VirtualGrid.getSingleton().convertToVirtual(this._basePoint.x);
  }

  get y(): VirtualCoordinate {
    return VirtualGrid.getSingleton().convertToVirtual(this._basePoint.y);
  }

  // eslint-disable-next-line grouped-accessor-pairs
  set x(virtualX: VirtualCoordinate) {
    this._basePoint.x = VirtualGrid.getSingleton().convertToBase(virtualX);
  }

  // eslint-disable-next-line grouped-accessor-pairs
  set y(virtualY: VirtualCoordinate) {
    this._basePoint.y = VirtualGrid.getSingleton().convertToBase(virtualY);
  }

  equals(otherPoint: VirtualPoint | null) {
    return otherPoint !== null && this.x === otherPoint.x && this.y === otherPoint.y;
  }

  createCopy() {
    return new VirtualPoint(this.x, this.y);
  }
}

export type ScreenCoordinate = number & { _coordinateType: 'screen' };

export type ProjectCoordinate = number & { _coordinateType: 'project' };

export class ProjectGrid {
  /* Holds all the properties for the project grid, plus the conversion function for
  converting project coordinates to virtual ones. */

  // Because we use the CSS translate() function to implement translations, we keep the
  // translation offsets in project coordinates. That allows us to directly pass them to
  // the translate() function. Otherwise if we kept the offsets in virtual coordinates we
  // would need to convert them to project coordinates.
  public translationX: ProjectCoordinate = 0 as ProjectCoordinate;
  public translationY: ProjectCoordinate = 0 as ProjectCoordinate;
  private htmlElement: HTMLElement | null = null;

  private _zoomFactor: number = 1.0; // in percentage
  // eslint-disable-next-line no-use-before-define

  constructor(
    initialZoomFactor: number,
    initialTranslationX: ProjectCoordinate,
    initialTranslationY: ProjectCoordinate,
  ) {
    this._zoomFactor = initialZoomFactor;
    this.translationX = initialTranslationX;
    this.translationY = initialTranslationY;
  }

  setHTMLElement(el: HTMLElement) {
    this.htmlElement = el;
  }

  convertScreenPointToProjectPoint(sp: ScreenPoint) {
    if (this.htmlElement === null) {
      throw new Error(
        'Cannot convert screen point to project point because the project grid has no reference to the html element it belongs to.',
      );
    }

    const rect = this.htmlElement.getBoundingClientRect();

    return new ProjectPoint(sp.x - rect.left, sp.y - rect.top, this);
  }

  getVirtualBoundingBoxOfElementWithId(id: string) {
    const el = document.getElementById(id);
    const rect = el?.getBoundingClientRect();
    if (!rect) {
      throw new Error(`HTML Element with id ${id} cannot be found`);
    }
    const topLeft = this.convertScreenPointToProjectPoint(
      new ScreenPoint(rect.left as ScreenCoordinate, rect.top as ScreenCoordinate),
    ).virtualPoint;
    const bottomRight = this.convertScreenPointToProjectPoint(
      new ScreenPoint(
        (rect.left + rect.width) as ScreenCoordinate,
        (rect.top + rect.height) as ScreenCoordinate,
      ),
    ).virtualPoint;
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  getVirtualPositionOfMouse(event: MouseEvent) {
    return this.convertScreenPointToProjectPoint(
      new ScreenPoint(event.pageX as ScreenCoordinate, event.pageY as ScreenCoordinate),
    ).virtualPoint;
  }

  getProjectPositionOfMouse(event: MouseEvent) {
    return this.convertScreenPointToProjectPoint(
      new ScreenPoint(
        event.clientX as ScreenCoordinate,
        event.clientY as ScreenCoordinate,
      ),
    );
  }

  get height() {
    const height = this.htmlElement?.offsetHeight;

    if (height === undefined) {
      throw new Error('Cannot get height');
    }
    return height;
  }

  get width() {
    const width = this.htmlElement?.offsetWidth;

    if (width === undefined) {
      throw new Error('Cannot get width');
    }
    return width;
  }

  get middlePoint() {
    return new ProjectPoint(this.width / 2, this.height / 2, this);
  }

  public convertToVirtualCoordinate(
    projectCoord: ProjectCoordinate,
    axis: 'x' | 'y',
  ): VirtualCoordinate {
    // First remove the translation offsets from the project coordinate so that we center
    // it in the virtual grid. E.g. if the translation offset is 10 then the project
    // points (10, 10) & (20, 20) would correspond to the virtual points (0, 0) &
    // (10, 10).

    let coordCenteredAroundVirtualGrid: number;
    if (axis === 'x') {
      coordCenteredAroundVirtualGrid = projectCoord - this.translationX;
    } else {
      // axis === 'y'
      coordCenteredAroundVirtualGrid = projectCoord - this.translationY;
    }

    // Next, now that we are centered around the origin point (0, 0) of the virtual grid,
    // apply the inverse of the zoom factor (zooming out makes the grid smaller so one
    // project coordinates is more virtual coordinates). E.g. for zoom factor of 200% our
    // previous example points which have been centered (0, 0) & (10, 10) become (0, 0) &
    // (5, 5).
    const inverseZoomFactor = 1 / this._zoomFactor;

    const zoomedAndCenteredCoord = coordCenteredAroundVirtualGrid * inverseZoomFactor;
    return zoomedAndCenteredCoord as VirtualCoordinate;
  }

  public convertToVirtualPoint(projectPoint: ProjectPoint) {
    return new VirtualPoint(
      this.convertToVirtualCoordinate(projectPoint.x, 'x'),
      this.convertToVirtualCoordinate(projectPoint.y, 'y'),
    );
  }

  public convertToProject(
    virtualCoord: VirtualCoordinate,
    axis: 'x' | 'y',
  ): ProjectCoordinate {
    // basically, we do the operations which we do in "convertToVirtual", but in reverse

    // First, we  apply the zoom factor. E.g. for a zoom factor of 200% our the points
    // (0, 0) & (10, 10) become (0, 0) & (20, 20).
    const zoomedCoord = virtualCoord * this._zoomFactor;

    // Then we add the translation offsets. E.g. if the translation offset is 10 then the
    // zoomed virtual points (0, 0) & (20, 20) would correspond to the project points
    // (10, 10) & (30, 30).
    let zoomedAndTranslatedCoord: number;
    if (axis === 'x') {
      zoomedAndTranslatedCoord = zoomedCoord + this.translationX;
    } else {
      // axis === 'y'
      zoomedAndTranslatedCoord = zoomedCoord + this.translationY;
    }

    return zoomedAndTranslatedCoord as ProjectCoordinate;
  }

  /**
   * Returns the average of the passed points.
   * @param points A list of points.
   * @returns The average of the points.
   */
  public static getAveragePoint(points: VirtualPoint[]) {
    const xSum = points.reduce((sum, point) => sum + point.x, 0);
    const ySum = points.reduce((sum, point) => sum + point.y, 0);

    const middlePoint = new VirtualPoint(
      (xSum / points.length) as VirtualCoordinate,
      (ySum / points.length) as VirtualCoordinate,
    );
    return middlePoint;
  }

  public convertToProjectPoint(virtualPoint: VirtualPoint) {
    const x = this.convertToProject(virtualPoint.x, 'x');
    const y = this.convertToProject(virtualPoint.y, 'y');
    return new ProjectPoint(x, y, this);
  }

  /**
   * Applies the given zoom factor to the task grid with the given point as center point
    of the zoom
   * @param newZoom This value will be sanitized to be in the range of MIN_ZOOM_FACTOR and
   * MAX_ZOOM_FACTOR.
   * @param centerPoint Where the zoom operation should be centered around.
   * @param options 
   */
  // eslint-disable-next-line no-use-before-define
  setZoomFactor(
    newZoom: number,
    centerPoint: ProjectPoint,
    options?: Partial<{ animate: Boolean; animationDuration: number }>,
  ) {
    // Basic idea of this algo is to zoom the canvas to the new zoom level (from the
    // previous) while keeping the given point at the same position on the project. Why
    // keep the point at the same position? Because if we zoom with it as the center, it
    // shouldn't move, but rather everything around it.

    // If the animation option is set to true, we animate the zoom by calling this method
    // repeatedly with slightly different zoom factors. Otherwise, we just set the zoom
    // factor immediately.

    const newZoomSanitized = Math.min(
      Math.max(newZoom, MIN_ZOOM_FACTOR),
      MAX_ZOOM_FACTOR,
    );

    if (
      options?.animate &&
      (options.animationDuration === undefined || options.animationDuration > 0)
    ) {
      const animationDuration =
        options.animationDuration ?? 500;
      const initialZoomFactor = this._zoomFactor;
      const finalZoomFactor = newZoomSanitized;
      const startTime = Date.now();

      animateTransition(startTime, animationDuration, (progress) => {
        const currentZoomFactor =
          initialZoomFactor + progress * (finalZoomFactor - initialZoomFactor);
        this.setZoomFactor(currentZoomFactor, centerPoint, {
          ...options,
          animate: false,
        });
      });
    }

    // Procedure of the algo below:
    //   - computes a relative zoom which we can later apply to the canvas so that we can
    //     resize everything correctly to the new zoom level
    //   - calculate the current distance (1) of the center point to the virtual axes and
    //     then apply the relative zoom to this distance, this new distance (2) is going
    //     to be the distance from the center point to the axes after we apply the zoom
    //   - lastly compute the change in the above two distances (1), (2), we need this to
    //     increase/decrease the translations of the virtual grid as this way we can
    //     achieve the effect of the center point staying in the same place after the
    //     zoom

    // We compute a relative zoom, why? Because if our current zoom is 0.8 and our new
    // zoom should be 1.2 then we don't need to adjust (zoom in) by their difference
    // 1.2-0.8 = 0.4, but rather by their ratios 1.2/0.8 = 1.5 to get the wanted effect.
    // This makes sense because if our starting zoom is 1.0 and we want to get a new of
    // 0.8 we would apply a relative zoom of 0.8/1.0 = 0.8 and, reverse, to go back to
    // 1.0 we would apply the inverse of that i.e. 1.0/0.8 = 1.25. This ratio of current
    // zoom and previous zoom we call the relative zoom.
    const relativeZoom = newZoomSanitized / this._zoomFactor;

    //           zoom = 1.0                           zoom = 0.8
    // ┌────────────────────────────┐        ┌────────────────────────────┐
    // │       │  virtual axes      │        │                            │
    // │  ─────┼────────────────►   │        |            virtual axes    |
    // │       │                    │  zoom  │      ────┼───────────►     │
    // │       │       point        │  out   │          │    point        │
    // |◄─────►│◄──────►┌┐          │  ===>  |◄─────►◄─►│◄───►┌┐          │
    // │transl │   old  └┘          │        │  transl  │ new └┘          │
    // │       │   dist             │        │ + diff   ▼ dist            │
    // │       ▼                    │        │                            │
    // └────────────────────────────┘        └────────────────────────────┘

    // distances from center point to the appropriate virtual axis
    const oldDistanceX: number = centerPoint.x - this.translationX;
    const oldDistanceY: number = centerPoint.y - this.translationY;

    const newDistanceX: number = oldDistanceX * relativeZoom;
    const newDistanceY: number = oldDistanceY * relativeZoom;

    // we want the new translation and to get it we use the mathematical equivalence of:
    //   newTransl = transl + diff
    //             = transl + (old_dist - new_dist)
    //             = (transl + old_dist) - new_dist
    //             = point_dist - new_dist
    //     where point_dist is the distance of the point to the edge
    this.translationX = (centerPoint.x - newDistanceX) as ProjectCoordinate;
    this.translationY = (centerPoint.y - newDistanceY) as ProjectCoordinate;

    // save the new zoom factor after we finished with the conversion
    this._zoomFactor = newZoomSanitized;
  }

  getZoomFactor(): number {
    return this._zoomFactor;
  }

  setTranslation(x: number, y: number) {
    this.translationX = x as ProjectCoordinate;
    this.translationY = y as ProjectCoordinate;
  }

  /**
   * Translates the screen grid by the specified amount.
   * @param deltaX change in x axis
   * @param deltaY change in y axis
   */
  translate(deltaX: number, deltaY: number, options?: Partial<{ animate: Boolean }>) {
    /**
     * If the animation option is set to true, we animate the translation by calling
     * the {@link setTranslation} method repeatedly with slightly different translations.
     * Otherwise, we just set the new translation immediately.
     */
    if (options?.animate) {
      const initialTranslationX = this.translationX;
      const initialTranslationY = this.translationY;
      const startTime = Date.now();

      animateTransition(
        startTime,
        500,
        (progress) => {
          this.setTranslation(
            initialTranslationX + progress * deltaX,
            initialTranslationY + progress * deltaY,
          );
        },
        { easingFunction: 'cubic-bezier' },
      );
    }

    this.translationX = (this.translationX + deltaX) as ProjectCoordinate;
    this.translationY = (this.translationY + deltaY) as ProjectCoordinate;
  }
}

export class ProjectPoint {
  public readonly virtualPoint: VirtualPoint;
  private projectGrid: ProjectGrid;

  constructor(x: number, y: number, projectGrid: ProjectGrid) {
    this.projectGrid = projectGrid;
    const virtualX = projectGrid.convertToVirtualCoordinate(x as ProjectCoordinate, 'x');
    const virtualY = projectGrid.convertToVirtualCoordinate(y as ProjectCoordinate, 'y');

    this.virtualPoint = new VirtualPoint(virtualX, virtualY);
  }

  set x(projectX: ProjectCoordinate) {
    this.virtualPoint.x = this.projectGrid.convertToVirtualCoordinate(projectX, 'x');
  }

  set y(projectY: ProjectCoordinate) {
    this.virtualPoint.x = this.projectGrid.convertToVirtualCoordinate(projectY, 'y');
  }

  // eslint-disable-next-line grouped-accessor-pairs
  get x(): ProjectCoordinate {
    return this.projectGrid.convertToProject(this.virtualPoint.x, 'x');
  }

  // eslint-disable-next-line grouped-accessor-pairs
  get y(): ProjectCoordinate {
    return this.projectGrid.convertToProject(this.virtualPoint.y, 'y');
  }

  get basePoint(): BasePoint {
    /* quick access method for convenience */

    return this.virtualPoint._basePoint;
  }
}

export class ScreenPoint {
  x: ScreenCoordinate;
  y: ScreenCoordinate;

  constructor(x: ScreenCoordinate, y: ScreenCoordinate) {
    this.x = x;
    this.y = y;
  }
}
