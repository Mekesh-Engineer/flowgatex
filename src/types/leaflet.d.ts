/**
 * Leaflet Type Declarations
 * 
 * This file provides TypeScript declarations for Leaflet when loaded via CDN.
 * The Leaflet library is loaded from unpkg.com in index.html.
 */

declare global {
  interface Window {
    L: typeof L;
  }
}

declare namespace L {
  // Core Map
  function map(element: HTMLElement | string, options?: MapOptions): Map;

  interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
    zoomControl?: boolean;
    scrollWheelZoom?: boolean;
    dragging?: boolean;
    touchZoom?: boolean;
    doubleClickZoom?: boolean;
    boxZoom?: boolean;
    tap?: boolean;
    trackResize?: boolean;
    worldCopyJump?: boolean;
    closePopupOnClick?: boolean;
    keyboard?: boolean;
    keyboardPanDelta?: number;
    inertia?: boolean;
    maxBounds?: LatLngBoundsExpression;
    renderer?: Renderer;
    zoomAnimation?: boolean;
    zoomAnimationThreshold?: number;
    fadeAnimation?: boolean;
    markerZoomAnimation?: boolean;
    maxZoom?: number;
    minZoom?: number;
  }

  interface Map {
    setView(center: LatLngExpression, zoom?: number, options?: ZoomPanOptions): this;
    fitBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
    remove(): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    getCenter(): LatLng;
    getZoom(): number;
    getBounds(): LatLngBounds;
    panTo(latlng: LatLngExpression, options?: PanOptions): this;
    on(type: string, fn: Function): this;
    off(type?: string, fn?: Function): this;
  }

  // Layers
  function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
  function layerGroup(layers?: Layer[]): LayerGroup;
  function marker(latlng: LatLngExpression, options?: MarkerOptions): Marker;

  interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
    minZoom?: number;
    subdomains?: string | string[];
    errorTileUrl?: string;
    zoomOffset?: number;
    tms?: boolean;
    zoomReverse?: boolean;
    detectRetina?: boolean;
    crossOrigin?: boolean | string;
  }

  interface TileLayer extends Layer {
    addTo(map: Map): this;
  }

  interface LayerGroup extends Layer {
    addTo(map: Map): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    clearLayers(): this;
    getLayers(): Layer[];
  }

  interface Layer {
    addTo(map: Map): this;
    remove(): this;
    bindPopup(content: string | HTMLElement, options?: PopupOptions): this;
    openPopup(): this;
    closePopup(): this;
  }

  // Marker
  interface MarkerOptions {
    icon?: Icon | DivIcon;
    clickable?: boolean;
    draggable?: boolean;
    keyboard?: boolean;
    title?: string;
    alt?: string;
    zIndexOffset?: number;
    opacity?: number;
    riseOnHover?: boolean;
    riseOffset?: number;
  }

  interface Marker extends Layer {
    setLatLng(latlng: LatLngExpression): this;
    getLatLng(): LatLng;
    setIcon(icon: Icon | DivIcon): this;
    bindPopup(content: string | HTMLElement, options?: PopupOptions): this;
  }

  // LatLng
  type LatLngExpression = LatLng | LatLngLiteral | LatLngTuple;
  type LatLngTuple = [number, number];

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  class LatLng {
    constructor(latitude: number, longitude: number, altitude?: number);
    lat: number;
    lng: number;
    alt?: number;
    equals(otherLatLng: LatLngExpression, maxMargin?: number): boolean;
    distanceTo(otherLatLng: LatLngExpression): number;
  }

  // LatLngBounds
  type LatLngBoundsExpression = LatLngBounds | LatLngBoundsLiteral;
  type LatLngBoundsLiteral = [LatLngTuple, LatLngTuple];

  function latLngBounds(corner1: LatLngExpression, corner2: LatLngExpression): LatLngBounds;
  function latLngBounds(latlngs: LatLngExpression[]): LatLngBounds;

  class LatLngBounds {
    constructor(corner1: LatLngExpression, corner2: LatLngExpression);
    extend(latlng: LatLngExpression | LatLngBoundsExpression): this;
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
    getNorthWest(): LatLng;
    getSouthEast(): LatLng;
    getWest(): number;
    getSouth(): number;
    getEast(): number;
    getNorth(): number;
    contains(otherBounds: LatLngBoundsExpression | LatLngExpression): boolean;
    intersects(otherBounds: LatLngBoundsExpression): boolean;
    overlaps(otherBounds: LatLngBoundsExpression): boolean;
    getCenter(): LatLng;
    isValid(): boolean;
    pad(bufferRatio: number): LatLngBounds;
  }

  // Popup
  interface PopupOptions {
    maxWidth?: number;
    minWidth?: number;
    maxHeight?: number;
    autoPan?: boolean;
    autoPanPaddingTopLeft?: Point;
    autoPanPaddingBottomRight?: Point;
    autoPanPadding?: Point;
    keepInView?: boolean;
    closeButton?: boolean;
    autoClose?: boolean;
    closeOnEscapeKey?: boolean;
    closeOnClick?: boolean;
    className?: string;
  }

  // Icon
  interface Icon {
    createIcon(oldIcon?: HTMLElement): HTMLElement;
    createShadow(oldIcon?: HTMLElement): HTMLElement;
  }

  interface DivIcon extends Icon {
    options: DivIconOptions;
  }

  interface DivIconOptions {
    html?: string | HTMLElement;
    iconSize?: Point | PointTuple;
    iconAnchor?: Point | PointTuple;
    className?: string;
  }

  // Point
  type PointTuple = [number, number];

  class Point {
    constructor(x: number, y: number, round?: boolean);
    x: number;
    y: number;
  }

  // Renderer
  interface Renderer extends Layer {}

  // Pan/Zoom Options
  interface ZoomPanOptions {
    animate?: boolean;
    duration?: number;
    easeLinearity?: number;
    noMoveStart?: boolean;
  }

  interface PanOptions {
    animate?: boolean;
    duration?: number;
    easeLinearity?: number;
    noMoveStart?: boolean;
  }

  interface FitBoundsOptions extends ZoomPanOptions {
    paddingTopLeft?: PointTuple;
    paddingBottomRight?: PointTuple;
    padding?: PointTuple;
    maxZoom?: number;
  }
}

export {};
