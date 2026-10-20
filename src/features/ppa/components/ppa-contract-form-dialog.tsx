'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { lo } from '@/lib/i18n/lo';
import { ppaSchema, type PpaFormValues } from '../schemas/ppa.schema';
import type { EnergyType, PpaContract } from '../types';

export interface PpaContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PpaFormValues) => Promise<void>;
  initialData?: PpaContract;
}

export function PpaContractFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: PpaContractFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PpaFormValues>({
    resolver: zodResolver(ppaSchema),
    defaultValues: initialData
      ? {
          contractNo: initialData.contractNo,
          projectName: initialData.projectName,
          developerName: initialData.developer.name,
          energyType: initialData.energyType,
          capacityMw: initialData.capacityMw,
          tariffUsCentPerKwh: initialData.tariffUsCentPerKwh,
          annualEnergyGwh: initialData.annualEnergyGwh ?? undefined,
          market: initialData.market,
          signedDate: initialData.signedDate ?? '',
          codDate: initialData.codDate ?? '',
          endDate: initialData.endDate ?? '',
          termYears: initialData.termYears ?? 25,
          status: initialData.status,
          notes: initialData.notes ?? '',
        }
      : {
          contractNo: '',
          projectName: '',
          developerName: '',
          energyType: 'hydro',
          capacityMw: 100,
          tariffUsCentPerKwh: 5.5,
          market: 'domestic',
          signedDate: '2026-01-01',
          codDate: '2027-01-01',
          endDate: '2052-01-01',
          termYears: 25,
          status: 'active',
          notes: '',
        },
  });

  const energyType = watch('energyType');
  const market = watch('market');

  const onFormSubmit = async (data: PpaFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto rounded-[24px] border border-[var(--border-glass)] bg-[var(--surface-modal)] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--ppa)]/40 bg-[var(--ppa)]/10 text-[var(--ppa)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="font-serif text-xl font-semibold text-[var(--text-strong)]">
              {initialData ? lo.ppa.actions.edit : lo.ppa.actions.createModal}
            </DialogTitle>
            <p className="text-xs text-[var(--text-muted)]">
              {lo.ppa.subtitle}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Contract No */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contractNo" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.contractNo} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="contractNo"
                {...register('contractNo')}
                placeholder="PPA-EDL-2026-..."
                className="bg-[var(--surface-input)]"
              />
              {errors.contractNo && (
                <span className="text-[11px] text-rose-400">{errors.contractNo.message}</span>
              )}
            </div>

            {/* Project Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="projectName" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.projectName} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="projectName"
                {...register('projectName')}
                placeholder="ເຂື່ອນໄຟຟ້າ..."
                className="bg-[var(--surface-input)]"
              />
              {errors.projectName && (
                <span className="text-[11px] text-rose-400">{errors.projectName.message}</span>
              )}
            </div>

            {/* Developer Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="developerName" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.developer} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="developerName"
                {...register('developerName')}
                placeholder="ຊື່ບໍລິສັດ/ຜູ້ພັດທະນາ"
                className="bg-[var(--surface-input)]"
              />
              {errors.developerName && (
                <span className="text-[11px] text-rose-400">{errors.developerName.message}</span>
              )}
            </div>

            {/* Energy Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="energyType" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.energyType} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Select
                value={energyType}
                onValueChange={(val) => setValue('energyType', val as EnergyType)}
              >
                <SelectTrigger id="energyType" className="bg-[var(--surface-input)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydro">{lo.energy.hydro}</SelectItem>
                  <SelectItem value="solar">{lo.energy.solar}</SelectItem>
                  <SelectItem value="wind">{lo.energy.wind}</SelectItem>
                  <SelectItem value="coal">{lo.energy.coal}</SelectItem>
                  <SelectItem value="biomass">{lo.energy.biomass}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Capacity MW */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacityMw" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.capacityMw} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="capacityMw"
                type="number"
                step="any"
                {...register('capacityMw', { valueAsNumber: true })}
                className="bg-[var(--surface-input)]"
              />
              {errors.capacityMw && (
                <span className="text-[11px] text-rose-400">{errors.capacityMw.message}</span>
              )}
            </div>

            {/* Tariff US cents */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tariffUsCentPerKwh" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.tariff} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="tariffUsCentPerKwh"
                type="number"
                step="any"
                {...register('tariffUsCentPerKwh', { valueAsNumber: true })}
                className="bg-[var(--surface-input)]"
              />
              {errors.tariffUsCentPerKwh && (
                <span className="text-[11px] text-rose-400">{errors.tariffUsCentPerKwh.message}</span>
              )}
            </div>

            {/* Annual Energy GWh */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="annualEnergyGwh" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.annualEnergyGwh}
              </Label>
              <Input
                id="annualEnergyGwh"
                type="number"
                step="any"
                {...register('annualEnergyGwh', { valueAsNumber: true })}
                className="bg-[var(--surface-input)]"
              />
            </div>

            {/* Market */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="market" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.market} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Select
                value={market}
                onValueChange={(val) => setValue('market', val as 'domestic' | 'export')}
              >
                <SelectTrigger id="market" className="bg-[var(--surface-input)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">{lo.market.domestic}</SelectItem>
                  <SelectItem value="export">{lo.market.export}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Signed Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signedDate" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.signedDate} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="signedDate"
                type="date"
                {...register('signedDate')}
                className="bg-[var(--surface-input)]"
              />
              {errors.signedDate && (
                <span className="text-[11px] text-rose-400">{errors.signedDate.message}</span>
              )}
            </div>

            {/* COD Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="codDate" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.codDate} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="codDate"
                type="date"
                {...register('codDate')}
                className="bg-[var(--surface-input)]"
              />
              {errors.codDate && (
                <span className="text-[11px] text-rose-400">{errors.codDate.message}</span>
              )}
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.endDate} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                className="bg-[var(--surface-input)]"
              />
              {errors.endDate && (
                <span className="text-[11px] text-rose-400">{errors.endDate.message}</span>
              )}
            </div>

            {/* Term Years */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="termYears" className="text-xs text-[var(--text-secondary)]">
                {lo.ppa.fields.termYears} <span className="text-[#d4b37a]">*</span>
              </Label>
              <Input
                id="termYears"
                type="number"
                {...register('termYears', { valueAsNumber: true })}
                className="bg-[var(--surface-input)]"
              />
              {errors.termYears && (
                <span className="text-[11px] text-rose-400">{errors.termYears.message}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes" className="text-xs text-[var(--text-secondary)]">
              {lo.ppa.fields.notes}
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              rows={3}
              placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
              className="bg-[var(--surface-input)]"
            />
          </div>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              {lo.ppa.actions.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? lo.common.loading : lo.ppa.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
