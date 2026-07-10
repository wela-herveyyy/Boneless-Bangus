import { useLabelStyles } from "./label.hooks";

interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

export function Label({ children, className: customClassName, ...props }: LabelProps) {
  const baseClass = useLabelStyles();
  const combinedClass = customClassName ? `${baseClass} ${customClassName}` : baseClass;

  return <span className={combinedClass} {...props}>{children}</span>;
}
