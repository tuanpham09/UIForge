declare namespace JSX {
  type Element = object;
  interface IntrinsicElements {
    [element: string]: Record<string, unknown>;
  }
}

declare module "components/ui/button" {
  export const Button: (props: Record<string, unknown>) => JSX.Element;
}
declare module "components/ui/card" {
  export const Card: (props: Record<string, unknown>) => JSX.Element;
}
declare module "components/ui/input" {
  export const Input: (props: Record<string, unknown>) => JSX.Element;
}
