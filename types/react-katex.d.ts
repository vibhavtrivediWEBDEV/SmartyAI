declare module "react-katex" {
  import type { ComponentType, ReactNode } from "react";

  export interface BlockMathProps {
    children?: ReactNode;
    math?: string;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
  }

  export const BlockMath: ComponentType<BlockMathProps>;
  export const InlineMath: ComponentType<BlockMathProps>;
}