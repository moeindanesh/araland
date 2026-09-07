"use client";
import { useId } from "react";
import {
  Button as HeroButton,
  Input as HeroInput,
  TextArea as HeroTextArea,
  Modal as HeroModal,
  Select,
  ListBox,
  Label,
  Checkbox,
  Spinner,
} from "@heroui/react";
import { X, ArrowUpLeft, Sparkles } from "lucide-react";
import Link from "next/link";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      <span>
        آرالند<small>فضای رشد کسب‌وکار تو</small>
      </span>
    </Link>
  );
}
type NativeButtonProps = Omit<
  React.ComponentProps<typeof HeroButton>,
  "className" | "children"
> & {
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  "aria-busy"?: React.AriaAttributes["aria-busy"];
};

export function ActionButton({
  children,
  className = "",
  loading = false,
  disabled,
  isDisabled,
  type = "button",
  ...props
}: NativeButtonProps) {
  return (
    <HeroButton
      {...props}
      type={type}
      variant="ghost"
      className={`action-button ${className}`}
      isDisabled={loading || disabled || isDisabled}
      aria-busy={loading || props["aria-busy"]}
    >
      {loading && <Spinner size="sm" aria-hidden="true" />}
      {children}
    </HeroButton>
  );
}

export function Button({
  children,
  className = "",
  loading = false,
  disabled,
  isDisabled,
  type = "submit",
  ...props
}: NativeButtonProps) {
  const variant = className.includes("btn-danger")
    ? "danger"
    : className.includes("btn-outline")
      ? "outline"
      : "primary";
  return (
    <HeroButton
      {...props}
      type={type}
      variant={variant}
      className={`btn ${className}`}
      isDisabled={loading || disabled || isDisabled}
      aria-busy={loading || props["aria-busy"]}
    >
      {loading && <Spinner size="sm" aria-hidden="true" />}
      {children}
    </HeroButton>
  );
}

export function Input(props: React.ComponentProps<typeof HeroInput>) {
  return <HeroInput {...props} />;
}
export function TextArea(props: React.ComponentProps<typeof HeroTextArea>) {
  return <HeroTextArea {...props} />;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
  disabled,
  name,
  ...props
}: {
  label?: string;
  "aria-label"?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <Select
      {...props}
      name={name}
      className={`panel-select ${className}`}
      value={value}
      onChange={(key) => key !== null && onChange(String(key))}
      isDisabled={disabled}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="panel-select-popover">
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.value}
              id={option.value}
              textValue={option.label}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function CheckboxField({
  children,
  checked,
  defaultChecked,
  onChange,
  disabled,
  name,
  className = "",
}: {
  children: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
}) {
  return (
    <Checkbox
      className={`panel-checkbox ${className}`}
      name={name}
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onChange}
      isDisabled={disabled}
    >
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Label>{children}</Label>
      </Checkbox.Content>
    </Checkbox>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  return (
    <HeroModal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="panel-modal-backdrop"
    >
      <HeroModal.Container
        placement="center"
        size="lg"
        scroll="inside"
        className="panel-modal-container"
      >
        <HeroModal.Dialog className="panel-modal" aria-labelledby={titleId}>
          <HeroModal.Header className="panel-modal-header">
            <HeroModal.Heading id={titleId}>{title}</HeroModal.Heading>
            <ActionButton
              className="icon-btn"
              onClick={onClose}
              aria-label="بستن"
            >
              <X size={20} aria-hidden="true" />
            </ActionButton>
          </HeroModal.Header>
          <HeroModal.Body className="panel-modal-body">
            {children}
          </HeroModal.Body>
        </HeroModal.Dialog>
      </HeroModal.Container>
    </HeroModal.Backdrop>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Sparkles size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Arrow() {
  return <ArrowUpLeft size={17} />;
}
export function Notice({
  message,
  error = false,
  id,
}: {
  message: string;
  error?: boolean;
  id?: string;
}) {
  return message ? (
    <div
      id={id}
      role={error ? "alert" : "status"}
      aria-atomic="true"
      className={`notice ${error ? "error" : ""}`}
    >
      {message}
    </div>
  ) : null;
}
