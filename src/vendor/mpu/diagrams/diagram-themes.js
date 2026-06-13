/**
 * Diagram Themes - Theme Configuration for Diagrams
 *
 * Provides theme configurations for Mermaid and PlantUML diagrams
 * using the Catppuccin color palette.
 */

/**
 * Catppuccin Latte (Light) theme colors for Mermaid
 */
export const MERMAID_LATTE = {
  text: '#4c4f69',
  background: '#eff1f5',
  surface: '#e6e9ef',
  overlay: '#ccd0da',
  primary: '#1e66f5',
  secondary: '#209fb5',
  error: '#d20f39',
  success: '#40a02b',
  line: '#8c8fa1',
};

/**
 * Catppuccin Mocha (Dark) theme colors for Mermaid
 */
export const MERMAID_MOCHA = {
  text: '#cdd6f4',
  background: '#1e1e2e',
  surface: '#313244',
  overlay: '#45475a',
  primary: '#89b4fa',
  secondary: '#b4befe',
  error: '#f38ba8',
  success: '#a6e3a1',
  line: '#a6adc8',
};

/**
 * Get Mermaid theme configuration
 * Matches legacy preview.js getMermaidThemeConfig for consistency
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {Object} Mermaid configuration object
 */
export function getMermaidThemeConfig(isDark) {
  return {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: isDark ? {
      // Catppuccin Mocha (Dark theme)
      background: '#1e1e2e',
      primaryColor: '#313244',
      primaryTextColor: '#cdd6f4',
      primaryBorderColor: '#45475a',
      secondaryColor: '#45475a',
      secondaryTextColor: '#cdd6f4',
      secondaryBorderColor: '#585b70',
      tertiaryColor: '#181825',
      tertiaryTextColor: '#cdd6f4',
      tertiaryBorderColor: '#313244',
      lineColor: '#cbd1e6',  // 25% brighter - for arrow/edge visibility
      textColor: '#cdd6f4',
      mainBkg: '#313244',
      nodeBorder: '#89b4fa',
      clusterBkg: '#181825',
      clusterBorder: '#45475a',
      titleColor: '#cdd6f4',
      edgeLabelBackground: '#313244',
      // Flowchart specific
      nodeTextColor: '#cdd6f4',
      // Sequence diagram specific
      actorBkg: '#313244',
      actorBorder: '#89b4fa',
      actorTextColor: '#cdd6f4',
      actorLineColor: '#cbd1e6',  // 25% brighter - for lifeline visibility
      signalColor: '#cbd1e6',  // 25% brighter - for arrow lines
      signalTextColor: '#dae0f7',  // 25% brighter - for arrow labels
      messageLine0: '#cbd1e6',  // 25% brighter - message lines
      messageLine1: '#cbd1e6',  // 25% brighter - message lines
      messageTextColor: '#dae0f7',  // 25% brighter - message labels on arrows
      labelBoxBkgColor: '#313244',
      labelBoxBorderColor: '#45475a',
      labelTextColor: '#dae0f7',  // 25% brighter
      loopTextColor: '#dae0f7',  // 25% brighter
      noteBorderColor: '#f9e2af',
      noteBkgColor: '#45475a',
      noteTextColor: '#dae0f7',  // 25% brighter
      activationBorderColor: '#89b4fa',
      activationBkgColor: '#45475a',
      sequenceNumberColor: '#1e1e2e',  // dark text on sequence numbers
      // State diagram specific
      labelColor: '#dae0f7',  // 25% brighter
      altBackground: '#181825',
      transitionColor: '#cbd1e6',  // 25% brighter - state transition arrows
      transitionLabelColor: '#dae0f7',  // 25% brighter - state transition labels
      stateLabelColor: '#dae0f7',  // 25% brighter
      // Class diagram specific
      classText: '#cdd6f4',
      relationColor: '#cbd1e6',  // 25% brighter - class relationship lines
      relationLabelColor: '#dae0f7',  // 25% brighter - relationship labels
      // ER diagram specific
      attributeBackgroundColorOdd: '#313244',
      attributeBackgroundColorEven: '#45475a',
      // Flowchart edge labels
      edgeLabelColor: '#dae0f7',  // 25% brighter - edge label text
      // Gantt chart specific
      sectionBkgColor: '#313244',
      altSectionBkgColor: '#45475a',
      gridColor: '#585b70',
      doneTaskBkgColor: '#a6e3a1',
      doneTaskBorderColor: '#a6e3a1',
      critBorderColor: '#f38ba8',
      critBkgColor: '#45475a',
      todayLineColor: '#f38ba8',
      taskTextColor: '#dae0f7',  // 25% brighter
      taskTextOutsideColor: '#dae0f7',  // 25% brighter
      taskTextClickableColor: '#89b4fa',
      // Pie chart specific
      pie1: '#89b4fa',
      pie2: '#a6e3a1',
      pie3: '#f9e2af',
      pie4: '#f38ba8',
      pie5: '#cba6f7',
      pie6: '#fab387',
      pie7: '#94e2d5',
      pie8: '#f5c2e7',
      pieOuterStrokeWidth: '2px',
      pieTitleTextColor: '#dae0f7',  // 25% brighter
      pieSectionTextColor: '#1e1e2e',  // dark text on pie sections
      pieLegendTextColor: '#dae0f7',  // 25% brighter
    } : {
      // Catppuccin Latte (Light theme)
      background: '#eff1f5',
      primaryColor: '#e6e9ef',
      primaryTextColor: '#4c4f69',
      primaryBorderColor: '#ccd0da',
      secondaryColor: '#dce0e8',
      secondaryTextColor: '#4c4f69',
      secondaryBorderColor: '#bcc0cc',
      tertiaryColor: '#ccd0da',
      tertiaryTextColor: '#4c4f69',
      tertiaryBorderColor: '#acb0be',
      lineColor: '#5c5f77',  // subtext1 - dark for arrow/edge visibility
      textColor: '#4c4f69',
      mainBkg: '#e6e9ef',
      nodeBorder: '#1e66f5',
      clusterBkg: '#dce0e8',
      clusterBorder: '#ccd0da',
      titleColor: '#4c4f69',
      edgeLabelBackground: '#e6e9ef',
      // Flowchart specific
      nodeTextColor: '#4c4f69',
      // Sequence diagram specific
      actorBkg: '#e6e9ef',
      actorBorder: '#1e66f5',
      actorTextColor: '#4c4f69',
      actorLineColor: '#5c5f77',  // subtext1 - dark for lifeline visibility
      signalColor: '#5c5f77',  // subtext1 - dark for arrow lines
      signalTextColor: '#4c4f69',  // text - dark for arrow labels
      messageLine0: '#5c5f77',  // subtext1 - message lines
      messageLine1: '#5c5f77',  // subtext1 - message lines
      messageTextColor: '#4c4f69',  // text - message labels on arrows
      labelBoxBkgColor: '#e6e9ef',
      labelBoxBorderColor: '#ccd0da',
      labelTextColor: '#4c4f69',
      loopTextColor: '#4c4f69',
      noteBorderColor: '#df8e1d',
      noteBkgColor: '#dce0e8',
      noteTextColor: '#4c4f69',
      activationBorderColor: '#1e66f5',
      activationBkgColor: '#dce0e8',
      sequenceNumberColor: '#eff1f5',  // light text on sequence numbers
      // State diagram specific
      labelColor: '#4c4f69',
      altBackground: '#dce0e8',
      transitionColor: '#5c5f77',  // subtext1 - state transition arrows
      transitionLabelColor: '#4c4f69',  // text - state transition labels
      stateLabelColor: '#4c4f69',
      // Class diagram specific
      classText: '#4c4f69',
      relationColor: '#5c5f77',  // subtext1 - class relationship lines
      relationLabelColor: '#4c4f69',  // text - relationship labels
      // ER diagram specific
      attributeBackgroundColorOdd: '#e6e9ef',
      attributeBackgroundColorEven: '#dce0e8',
      // Flowchart edge labels
      edgeLabelColor: '#4c4f69',  // text - edge label text
      // Gantt chart specific
      sectionBkgColor: '#e6e9ef',
      altSectionBkgColor: '#dce0e8',
      gridColor: '#acb0be',
      doneTaskBkgColor: '#40a02b',
      doneTaskBorderColor: '#40a02b',
      critBorderColor: '#d20f39',
      critBkgColor: '#dce0e8',
      todayLineColor: '#d20f39',
      taskTextColor: '#4c4f69',
      taskTextOutsideColor: '#4c4f69',
      taskTextClickableColor: '#1e66f5',
      // Pie chart specific
      pie1: '#1e66f5',
      pie2: '#40a02b',
      pie3: '#df8e1d',
      pie4: '#d20f39',
      pie5: '#8839ef',
      pie6: '#fe640b',
      pie7: '#179299',
      pie8: '#ea76cb',
      pieOuterStrokeWidth: '2px',
      pieTitleTextColor: '#4c4f69',
      pieSectionTextColor: '#eff1f5',  // light text on pie sections
      pieLegendTextColor: '#4c4f69',
    },
    flowchart: {
      useMaxWidth: false,  // Fixed pixel size for consistent dimensions
      htmlLabels: true,
    },
    sequence: {
      useMaxWidth: false,
    },
    gantt: {
      useMaxWidth: false,
    },
    pie: {
      useMaxWidth: false,
    },
    er: {
      useMaxWidth: false,
    },
    class: {
      useMaxWidth: false,
    },
    state: {
      useMaxWidth: false,
    },
  };
}

/**
 * Catppuccin Latte (Light) PlantUML skinparams
 * @returns {string} PlantUML skinparam declarations
 */
export function getPlantUmlLatteSkinparams() {
  return `skinparam backgroundColor #eff1f5
skinparam defaultFontColor #4c4f69
skinparam shadowing false
skinparam roundCorner 8
skinparam ArrowColor #8c8fa1
skinparam ArrowFontColor #6c6f85
skinparam ActorBackgroundColor #1e66f5
skinparam ActorBorderColor #209fb5
skinparam ParticipantBackgroundColor #e6e9ef
skinparam ParticipantBorderColor #acb0be
skinparam ParticipantFontColor #4c4f69
skinparam LifeLineBackgroundColor #ccd0da
skinparam LifeLineBorderColor #acb0be
skinparam SequenceBoxBackgroundColor #eff1f5
skinparam SequenceBoxBorderColor #acb0be
skinparam SequenceGroupBackgroundColor #ccd0da
skinparam SequenceGroupBorderColor #acb0be
skinparam SequenceDividerBackgroundColor #ccd0da
skinparam NoteBackgroundColor #df8e1d
skinparam NoteBorderColor #fe640b
skinparam NoteFontColor #dce0e8
skinparam ClassBackgroundColor #e6e9ef
skinparam ClassBorderColor #acb0be
skinparam ClassFontColor #4c4f69
skinparam ClassHeaderBackgroundColor #ccd0da
skinparam PackageBackgroundColor #eff1f5
skinparam PackageBorderColor #acb0be
skinparam ComponentBackgroundColor #e6e9ef
skinparam ComponentBorderColor #acb0be
skinparam DatabaseBackgroundColor #e6e9ef
skinparam DatabaseBorderColor #acb0be
skinparam NodeBackgroundColor #ccd0da
skinparam NodeBorderColor #acb0be
skinparam StateBackgroundColor #e6e9ef
skinparam StateBorderColor #acb0be
skinparam StateStartColor #40a02b
skinparam StateEndColor #d20f39
skinparam ActivityBackgroundColor #e6e9ef
skinparam ActivityBorderColor #acb0be
skinparam ActivityStartColor #40a02b
skinparam ActivityEndColor #d20f39
skinparam ActivityBarColor #1e66f5
skinparam ActivityDiamondBackgroundColor #ccd0da
skinparam ActivityDiamondBorderColor #acb0be
skinparam UsecaseBackgroundColor #e6e9ef
skinparam UsecaseBorderColor #acb0be
skinparam RectangleBackgroundColor #e6e9ef
skinparam RectangleBorderColor #acb0be
skinparam ObjectBackgroundColor #e6e9ef
skinparam ObjectBorderColor #acb0be
`;
}

/**
 * Catppuccin Mocha (Dark) PlantUML skinparams
 * @returns {string} PlantUML skinparam declarations
 */
export function getPlantUmlMochaSkinparams() {
  return `skinparam backgroundColor #1e1e2e
skinparam defaultFontColor #cdd6f4
skinparam shadowing false
skinparam roundCorner 8
skinparam ArrowColor #a6adc8
skinparam ArrowFontColor #bac2de
skinparam ActorBackgroundColor #89b4fa
skinparam ActorBorderColor #b4befe
skinparam ParticipantBackgroundColor #313244
skinparam ParticipantBorderColor #9399b2
skinparam ParticipantFontColor #cdd6f4
skinparam LifeLineBackgroundColor #45475a
skinparam LifeLineBorderColor #bac2de
skinparam SequenceLifeLineBorderColor #bac2de
skinparam SequenceBoxBackgroundColor #313244
skinparam SequenceBoxBorderColor #9399b2
skinparam SequenceGroupBackgroundColor #45475a
skinparam SequenceGroupBorderColor #9399b2
skinparam SequenceGroupBodyBackgroundColor #313244
skinparam SequenceDividerBackgroundColor #45475a
skinparam SequenceDividerBorderColor #9399b2
skinparam SequenceDividerFontColor #cdd6f4
skinparam SequenceMessageAlignment center
skinparam NoteBackgroundColor #f9e2af
skinparam NoteBorderColor #fab387
skinparam NoteFontColor #11111b
skinparam ClassBackgroundColor #313244
skinparam ClassBorderColor #9399b2
skinparam ClassFontColor #cdd6f4
skinparam ClassHeaderBackgroundColor #45475a
skinparam PackageBackgroundColor #1e1e2e
skinparam PackageBorderColor #9399b2
skinparam PackageFontColor #cdd6f4
skinparam ComponentBackgroundColor #313244
skinparam ComponentBorderColor #9399b2
skinparam ComponentFontColor #cdd6f4
skinparam DatabaseBackgroundColor #313244
skinparam DatabaseBorderColor #9399b2
skinparam DatabaseFontColor #cdd6f4
skinparam NodeBackgroundColor #45475a
skinparam NodeBorderColor #9399b2
skinparam NodeFontColor #cdd6f4
skinparam StateBackgroundColor #313244
skinparam StateBorderColor #9399b2
skinparam StateFontColor #cdd6f4
skinparam StateStartColor #a6e3a1
skinparam StateEndColor #f38ba8
skinparam ActivityBackgroundColor #313244
skinparam ActivityBorderColor #9399b2
skinparam ActivityFontColor #cdd6f4
skinparam ActivityStartColor #a6e3a1
skinparam ActivityEndColor #f38ba8
skinparam ActivityBarColor #89b4fa
skinparam ActivityDiamondBackgroundColor #45475a
skinparam ActivityDiamondBorderColor #9399b2
skinparam ActivityDiamondFontColor #cdd6f4
skinparam UsecaseBackgroundColor #313244
skinparam UsecaseBorderColor #9399b2
skinparam UsecaseFontColor #cdd6f4
skinparam RectangleBackgroundColor #313244
skinparam RectangleBorderColor #9399b2
skinparam RectangleFontColor #cdd6f4
skinparam ObjectBackgroundColor #313244
skinparam ObjectBorderColor #9399b2
skinparam ObjectFontColor #cdd6f4
`;
}

/**
 * Get PlantUML skinparams based on theme
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {string} PlantUML skinparam declarations
 */
export function getPlantUmlSkinparams(isDark) {
  return isDark ? getPlantUmlMochaSkinparams() : getPlantUmlLatteSkinparams();
}

/**
 * Inject theme skinparams into PlantUML code
 * @param {string} code - PlantUML diagram code
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {string} PlantUML code with theme skinparams injected
 */
export function injectPlantUmlTheme(code, isDark) {
  const skinparams = getPlantUmlSkinparams(isDark);
  const trimmedCode = code.trim();

  // Find the @startuml/@startXXX directive and extract it
  // Handle cases like "@startuml" alone or "@startuml diagram_name" or "@startuml(id=foo)"
  const startMatch = trimmedCode.match(/^(@start\w+(?:\s*\([^)]*\))?)/i);

  if (startMatch) {
    const startDirective = startMatch[1];
    // Get everything after the start directive
    const afterStart = trimmedCode.substring(startDirective.length);
    // Insert skinparams after the start directive
    return startDirective + '\n' + skinparams + afterStart.replace(/^\s*\n?/, '');
  }

  // If no @startuml found, wrap the code
  return '@startuml\n' + skinparams + trimmedCode + '\n@enduml';
}
