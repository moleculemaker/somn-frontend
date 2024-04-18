export interface MarvinJSUtilInstance {
  getEditor(elementId: string): Promise<Sketch>;

  getPackage(elementId: string): Promise<MarvinPackage>;
}

export interface MarvinPackage {
  onReady(callback: () => void): void;

  ImageExporter : ImageExporter;

  Sketch(elementName: string): Sketch;
}

export interface ImageExporter {
  molToDataUrl(structure: string, format: string, settings: RenderParamsSettings): string;
}

// The MarvinJs Structure Editor
// https://marvinjs-demo.chemaxon.com/latest/jsdoc.html#marvin.Sketch
export interface Sketch {

  // Returns true if HTML5 canvas is supported, false otherwise.
  isSupported(): true;

  // Remove the canvas content.
  clear(): void;

  // Determines whether the canvas is empty or not.
  isEmpty(): boolean

  // Returns a Promise object to import a molecule source. If the import operation is successful, the old structure will be replaced by the new one.
  importStructure(format: string, structure: string): Promise<void>;

  // Returns a Promise object to access the molecule source.
  exportStructure(format: string): Promise<string>;

  // Attaches an event handler function for the specified event to the editor. Supported events:
  //     "molchange": molecule change events
  //     "selectionchange": selection change events
  //     "undo": events when undo is performed
  //     "redo": events when redo is performed]
  on(eventType: string, callback: () => void): void;

  // Removes one or more event handlers for the specified event to the editor.
  off(eventType: string, callback: () => void): void;

  // Setup auto chirality mode. When you activate it, setup chiral flag on current structure and force it on every imported structure later.
  setAutoChirality(enable: boolean): void;

  setServices(param: { clean2dws: string; automapperws: string; reactionconvertws: string; stereoinfows: string; molconvertws: string; aromatizews: string; hydrogenizews: string; clean3dws: string }): void;
}

export interface RenderParams {
  imageType: string;
  settings: RenderParamsSettings;
  inputFormat: string;
}

export interface RenderParamsSettings {
  // Default: false (does not apply in "BALLSTICK" display mode)
  carbonLabelVisible: boolean;

  // Default: true
  chiralFlagVisible: boolean;

  // Default: true
  valenceErrorVisible: boolean;

  // Show lone pairs if MRV source contains proper info or auto lone pair calculation is enabled. Default: false.
  lonePairsVisible: boolean;

  // Set it to true to calculate lone pair on the current structure. Default: false.
  lonepaircalculationenabled: boolean;

  // Draw circle around positive and negative sign at charge or not. Default: false.
  circledsign: boolean;

  // default: false
  atomIndicesVisible: boolean;

  // default: true
  atomMapsVisible: boolean;

  // default: true
  cpkColoring: boolean;

  // Possible values: ["WIREFRAME" | "BALLSTICK" | "STICK" | "SPACEFILL"]. Default: "WIREFRAME".
  displayMode: string;

  // Possible values: ["ALL" | "OFF" | "HETERO" | "TERMINAL_AND_HETERO"]. Default: "TERMINAL_AND_HETERO".
  implicitHydrogen: string;

  // CSS color used as background color. Default: white or transparent (png).
  backgroundColor: string;

  // "fit" will expand every molecule to the given size, "autoshrink" scales down large molecules only. Default: "fit"
  zoomMode: string;
  //
  // Default: 200
  width: number;

  // Default: 200
  height: number;
}
