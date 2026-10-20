import { useId, useRef, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { CalendarIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { LAO_MONTHS_SHORT, LAO_WEEKDAYS, formatDate } from '@/lib/utils/date';

interface DatePickerProps {
  id: string;
  value: string | null;
  onChange: (v: string | null) => void;
  min?: string;
  max?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  clearable?: boolean;
  labelId?: string;
}

function toDate(iso?: string | null): Date | undefined {
  if (!iso) return undefined;
  const d = parseISO(iso);
  return isValid(d) ? d : undefined;
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  clearable,
  labelId,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const valueId = useId();
  const [now] = useState(() => new Date());
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={triggerRef}
            type="button"
            variant="outline"
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedby}
            aria-labelledby={labelId ? `${labelId} ${valueId}` : undefined}
            className={cn('h-11 flex-1 justify-start gap-2 font-normal', !selected && 'text-muted-foreground')}
          >
            <CalendarIcon aria-hidden="true" className="size-4" />
            <span id={valueId}>{selected ? formatDate(value) : lo.datePicker.placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label={lo.datePicker.open} className="w-auto bg-(image:--surface-modal) p-0" align="start">
          <Calendar
            mode="single"
            weekStartsOn={1}
            autoFocus
            captionLayout="dropdown"
            startMonth={new Date(1990, 0)}
            endMonth={new Date(now.getFullYear() + 50, 11)}
            selected={selected}
            defaultMonth={selected}
            disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
            onSelect={(d) => {
              if (!d) return;
              onChange(format(d, 'yyyy-MM-dd'));
              setOpen(false);
            }}
            formatters={{
              formatWeekdayName: (d) => LAO_WEEKDAYS[(d.getDay() + 6) % 7],
              formatMonthDropdown: (d) => LAO_MONTHS_SHORT[d.getMonth()],
              formatCaption: (d) => `${LAO_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
            }}
            labels={{
              labelPrevious: () => lo.datePicker.prevMonth,
              labelNext: () => lo.datePicker.nextMonth,
              labelMonthDropdown: () => lo.datePicker.month,
              labelYearDropdown: () => lo.datePicker.year,
              labelGrid: (d) => `${LAO_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
              labelDayButton: (d, m) => {
                let label = format(d, 'dd/MM/yyyy');
                if (m.today) label = `${lo.datePicker.today}, ${label}`;
                if (m.selected) label = `${label}, ${lo.datePicker.selected}`;
                return label;
              },
            }}
            classNames={{
              today: 'rounded-(--cell-radius) text-foreground ring-1 ring-inset ring-(--gold-decor) data-[selected=true]:ring-0',
            }}
            className="[--cell-size:40px] [&_[data-selected-single=true]]:bg-(image:--primary-gradient)"
          />
        </PopoverContent>
      </Popover>
      {clearable && selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={lo.datePicker.clear}
          onClick={() => {
            onChange(null);
            triggerRef.current?.focus();
          }}
        >
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      )}
    </div>
  );
}
