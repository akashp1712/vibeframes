import * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "hyperframes-player": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          controls?: boolean | string;
          autoplay?: boolean | string;
          muted?: boolean | string;
          loop?: boolean | string;
        },
        HTMLElement
      >;
    }
  }
}
