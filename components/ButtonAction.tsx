import React, {ReactElement, cloneElement} from "react";

export function ButtonAction({ children, className }: { children: ReactElement, className: String }) {
    const myArr = ["Plasmic", "is", "So", "Awesome"];
    if (React.isValidElement(children)) {
      return cloneElement(children as any, {
        onClick: () => console.log(myArr),
        className: className,
      });
    } else {
      return children;
    }
  }