// Type declarations for SPFx modules that don't ship their own types
// or aren't installed as direct dependencies

declare module '@microsoft/decorators' {
  export function override(
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor;
}

declare module '@microsoft/sp-dialog' {
  export class Dialog {
    static alert(message: string): Promise<void>;
    static prompt(message: string, defaultValue?: string): Promise<string | undefined>;
  }
}

declare module '@microsoft/sp-dynamic-data' {
  export interface IDynamicDataPropertyDefinition {
    id: string;
    title: string;
  }

  export interface IDynamicDataCallables {
    getPropertyDefinitions(): ReadonlyArray<IDynamicDataPropertyDefinition>;
    getPropertyValue(propertyId: string): unknown;
  }

  export class DynamicDataSourceManager {
    public initializeSource(callables: IDynamicDataCallables): void;
    public notifyPropertyChanged(propertyId: string): void;
  }
}
