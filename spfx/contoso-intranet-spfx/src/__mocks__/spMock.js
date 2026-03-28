// Comprehensive mock for all @microsoft/sp-* packages
// The jest.config.js moduleNameMapper routes all @microsoft/sp-* imports here

// --- @microsoft/sp-http ---

const SPHttpClient = {
  configurations: {
    v1: { flags: 1 },
  },
};

class SPHttpClientResponse {
  constructor(ok = true, status = 200, data = {}) {
    this.ok = ok;
    this.status = status;
    this._data = data;
  }
  json() {
    return Promise.resolve(this._data);
  }
  text() {
    return Promise.resolve(JSON.stringify(this._data));
  }
}

const HttpClient = {
  configurations: {
    v1: { flags: 1 },
  },
};

class HttpClientResponse {
  constructor(ok = true, status = 200, data = {}) {
    this.ok = ok;
    this.status = status;
    this._data = data;
  }
  json() {
    return Promise.resolve(this._data);
  }
  text() {
    return Promise.resolve(JSON.stringify(this._data));
  }
}

// MSGraphClientV3 fluent API mock factory
function createMockGraphClient() {
  const chainable = {};
  const methods = ['api', 'select', 'top', 'filter', 'header', 'search', 'orderby', 'expand', 'responseType', 'count', 'skip'];
  methods.forEach((method) => {
    chainable[method] = jest.fn().mockReturnValue(chainable);
  });
  chainable.get = jest.fn().mockResolvedValue({});
  chainable.post = jest.fn().mockResolvedValue({});
  chainable.patch = jest.fn().mockResolvedValue({});
  chainable.delete = jest.fn().mockResolvedValue({});
  return chainable;
}

// --- @microsoft/sp-webpart-base ---

class BaseClientSideWebPart {
  constructor() {
    this.context = createMockWebPartContext();
    this.properties = {};
    this.domElement = document.createElement('div');
  }
  render() {}
  onInit() {
    return Promise.resolve();
  }
  getPropertyPaneConfiguration() {
    return { pages: [] };
  }
}

function createMockWebPartContext() {
  return {
    pageContext: {
      web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/intranet' },
      site: { absoluteUrl: 'https://contoso.sharepoint.com' },
      user: { displayName: 'Test User', email: 'test@contoso.com', loginName: 'test@contoso.com' },
    },
    spHttpClient: {
      get: jest.fn(),
      post: jest.fn(),
    },
    msGraphClientFactory: {
      getClient: jest.fn().mockResolvedValue(createMockGraphClient()),
    },
    serviceScope: {
      consume: jest.fn(),
    },
    instanceId: 'test-instance-id',
    domElement: document.createElement('div'),
  };
}

const PropertyPaneTextField = jest.fn().mockImplementation((targetProperty, properties) => ({
  type: 1,
  targetProperty,
  properties,
}));

const PropertyPaneSlider = jest.fn().mockImplementation((targetProperty, properties) => ({
  type: 2,
  targetProperty,
  properties,
}));

const PropertyPaneDropdown = jest.fn().mockImplementation((targetProperty, properties) => ({
  type: 3,
  targetProperty,
  properties,
}));

const PropertyPaneToggle = jest.fn().mockImplementation((targetProperty, properties) => ({
  type: 4,
  targetProperty,
  properties,
}));

const PropertyPaneLabel = jest.fn().mockImplementation((targetProperty, properties) => ({
  type: 5,
  targetProperty,
  properties,
}));

// --- @microsoft/sp-application-base ---

const PlaceholderName = {
  Top: 'Top',
  Bottom: 'Bottom',
};

class BaseApplicationCustomizer {
  constructor() {
    this.context = {
      placeholderProvider: {
        tryCreateContent: jest.fn().mockReturnValue({
          domElement: document.createElement('div'),
        }),
      },
      pageContext: createMockWebPartContext().pageContext,
      spHttpClient: {
        get: jest.fn(),
        post: jest.fn(),
      },
    };
    this.properties = {};
  }
  onInit() {
    return Promise.resolve();
  }
}

// --- @microsoft/sp-core-library ---

const Log = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  verbose: jest.fn(),
};

const Environment = {
  type: 3, // Local
};

const EnvironmentType = {
  Local: 3,
  SharePoint: 4,
  ClassicSharePoint: 1,
};

const Version = {
  parse: jest.fn().mockReturnValue({ major: 1, minor: 0, patch: 0 }),
};

// --- @microsoft/sp-listview-extensibility ---

class BaseListViewCommandSet {
  constructor() {
    this.context = {
      pageContext: createMockWebPartContext().pageContext,
      spHttpClient: {
        get: jest.fn(),
        post: jest.fn(),
      },
      listView: {
        selectedRows: [],
      },
    };
    this.properties = {};
  }
  onInit() {
    return Promise.resolve();
  }
  onListViewUpdated() {}
  onExecute() {}
}

class BaseFieldCustomizer {
  constructor() {
    this.context = {
      pageContext: createMockWebPartContext().pageContext,
      domElement: document.createElement('div'),
      field: { internalName: 'TestField' },
      fieldValue: '',
    };
    this.properties = {};
  }
  onInit() {
    return Promise.resolve();
  }
  onRenderCell() {}
  onDisposeCell() {}
}

// --- @microsoft/sp-adaptive-card-extension-base ---

class BaseAdaptiveCardExtension {
  constructor() {
    this.state = {};
    this.properties = {};
    this.context = createMockWebPartContext();
  }
  onInit() {
    return Promise.resolve();
  }
  setState(newState) {
    this.state = { ...this.state, ...newState };
  }
}

class BaseCardView {
  get cardViewParameters() {
    return {};
  }
  get onCardSelection() {
    return undefined;
  }
}

class BaseAdaptiveCardView {
  get data() {
    return {};
  }
  get template() {
    return {};
  }
}

// --- Exports ---
// All exports from all @microsoft/sp-* packages in one object

module.exports = {
  // sp-http
  SPHttpClient,
  SPHttpClientResponse,
  HttpClient,
  HttpClientResponse,
  MSGraphClientV3: createMockGraphClient,

  // sp-webpart-base
  BaseClientSideWebPart,
  PropertyPaneTextField,
  PropertyPaneSlider,
  PropertyPaneDropdown,
  PropertyPaneToggle,
  PropertyPaneLabel,

  // sp-application-base
  PlaceholderName,
  BaseApplicationCustomizer,

  // sp-core-library
  Log,
  Environment,
  EnvironmentType,
  Version,

  // sp-listview-extensibility
  BaseListViewCommandSet,
  BaseFieldCustomizer,

  // sp-adaptive-card-extension-base
  BaseAdaptiveCardExtension,
  BaseCardView,
  BaseAdaptiveCardView,

  // Helpers (exported for test convenience)
  createMockGraphClient,
  createMockWebPartContext,
};
