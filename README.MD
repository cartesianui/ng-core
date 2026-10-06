# @cartesianui/platform-core

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.2.8.

## Code scaffolding

Run `ng generate component component-name --project core` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project core`.

> Note: Don't forget to add `--project core` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build core` to build the project. The build artifacts will be stored in the `dist/` directory.

## Development/Build

To generate all `*.js`, `*.js.map` and `*.d.ts` files. The build artifacts will be stored in the `dist/` directory.

```bash
$ npm run build:prod
```

## Publishing

After building your library, go to the dist folder `cd dist/core` and run `npm publish` or run below command

## Running unit tests

Run `ng test core` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

---

# Important

Issues of this repository are tracked on https://github.com/cartesianui/back-office-app. Please create your issues on https://github.com/cartesianui/back-office-app/issues.

## Installation

To install this library, run:

```bash
$ npm i @cartesianui/platform-core --save
```

## CartesianHttpInterceptor

In order to use CartesianHttpInterceptor, first import it into module like below;

```ts
import { CartesianHttpInterceptor } from '@cartesianui/platform-core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
```

then, add it to your module providers like below;

```ts
imports: [
    ///other imports
],
providers: [
    ///other providers
    { provide: HTTP_INTERCEPTORS, useClass: CartesianHttpInterceptor, multi: true }
]
```

## TenancyService

Import any other service e.g. TenancyService

```ts
import { TenancyService } from '@cartesianui/platform-core';
```

## License

MIT
