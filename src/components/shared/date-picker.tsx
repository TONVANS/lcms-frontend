import { useState } from 'react';
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
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedby}
            className={cn('h-11 flex-1 justify-start gap-2 font-normal', !selected && 'text-muted-foreground')}
          >
            <CalendarIcon aria-hidden="true" className="size-4" />
            {selected ? formatDate(value) : lo.datePicker.placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            weekStartsOn={1}
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
              formatCaption: (d) => `${LAO_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
            }}
            classNames={{
              today: 'rounded-(--cell-radius) text-foreground ring-1 ring-inset ring-[#b08a4a] data-[selected=true]:ring-0',
            }}
            className="[&_[data-selected-single=true]]:bg-(image:--primary-gradient)"
          />
        </PopoverContent>
      </Popover>
      {clearable && selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={lo.datePicker.clear}
          onClick={() => onChange(null)}
        >
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      )}
    </div>
  );
}
