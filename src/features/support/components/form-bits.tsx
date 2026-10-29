/** Native <select> styled like <Input>; Radix Select is avoided for these tiny dialogs. */
export const NATIVE_SELECT =
  'h-11 w-full min-w-0 rounded-[12px] border border-[rgba(11,27,58,0.14)] bg-(--surface-input) px-3 text-base dark:border-white/14 md:text-sm focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-(--text-error)">
      {message}
    </p>
  );
}
