'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/shared/glass-card';
import { Stepper } from '@/components/shared/stepper';
import { Button } from '@/components/ui/button';
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
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList, type FileItem } from '@/components/shared/file-list';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { ppaService } from '../api/ppa.service';
import { ppaSchema, type PpaFormValues } from '../schemas/ppa.schema';
import type { EnergyType } from '../types';

export function PpaWizardView() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<PpaFormValues>({
    resolver: zodResolver(ppaSchema),
    mode: 'onChange',
    defaultValues: {
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

  const formValues = watch();

  const steps = [
    { id: 1, label: lo.ppa.wizard.step1 },
    { id: 2, label: lo.ppa.wizard.step2 },
    { id: 3, label: lo.ppa.wizard.step3 },
    { id: 4, label: lo.ppa.wizard.step4 },
  ];

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger(['contractNo', 'projectName', 'developerName', 'market']);
    } else if (currentStep === 2) {
      isValid = await trigger(['energyType', 'capacityMw', 'tariffUsCentPerKwh']);
    } else if (currentStep === 3) {
      isValid = await trigger(['signedDate', 'codDate', 'endDate', 'termYears']);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFilesSelected = (files: File[]) => {
    const newItems: FileItem[] = files.map((f, i) => ({
      id: `local-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      mime: f.type,
      uploadedAt: new Date().toISOString(),
    }));
    setUploadedFiles((prev) => [...newItems, ...prev]);
    toast.success(lo.dropzone.fileUploaded);
  };

  const onFinalSubmit = async (data: PpaFormValues) => {
    setIsSubmitting(true);
    try {
      const created = await ppaService.create(data);
      toast.success(lo.ppa.createdSuccess);
      router.push(`/ppa/contracts/${created.id}`);
    } catch {
      toast.error(lo.errors.unknown);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round((currentStep / 4) * 100);

  return (
    <div className="mx-auto flex max-w-[1140px] flex-col gap-6 py-4">
      <PageHeader
        eyebrow="PPA WIZARD"
        title="ສ້າງສັນຍາຊື້-ຂາຍພະລັງງານແບບລະອຽດ"
        meta="ລະບຸຂໍ້ມູນໂຄງການ, ເຕັກນິກ, ລາຄາ ແລະ ເງື່ອນໄຂຕາມຂັ້ນຕອນ"
        accent="ppa"
      />

      {/* Stepper on top */}
      <GlassCard accent="ppa" className="p-6">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
        />
      </GlassCard>

      {/* Main wizard 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Form Card (2 cols) */}
        <div className="lg:col-span-2">
          <GlassCard accent="ppa" className="flex flex-col gap-6 p-6 sm:p-8">
            <form onSubmit={handleSubmit(onFinalSubmit)} className="flex flex-col gap-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-[var(--border-subtle)] pb-3">
                    <h3 className="font-serif text-lg font-semibold text-[var(--text-strong)]">
                      {lo.ppa.wizard.step1}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      ລະບຸເລກທີສັນຍາ ແລະ ຊື່ໂຄງການ
                    </p>
                  </div>

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

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="developerName" className="text-xs text-[var(--text-secondary)]">
                      {lo.ppa.fields.developer} <span className="text-[#d4b37a]">*</span>
                    </Label>
                    <Input
                      id="developerName"
                      {...register('developerName')}
                      placeholder="ບໍລິສັດຜູ້ພັດທະນາ..."
                      className="bg-[var(--surface-input)]"
                    />
                    {errors.developerName && (
                      <span className="text-[11px] text-rose-400">{errors.developerName.message}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="market" className="text-xs text-[var(--text-secondary)]">
                      {lo.ppa.fields.market} <span className="text-[#d4b37a]">*</span>
                    </Label>
                    <Select
                      value={formValues.market}
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
                </div>
              )}

              {/* Step 2: Technical & Tariff */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-[var(--border-subtle)] pb-3">
                    <h3 className="font-serif text-lg font-semibold text-[var(--text-strong)]">
                      {lo.ppa.wizard.step2}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      ກຳລັງການຜະລິດ, ປະເພດພະລັງງານ ແລະ ອັດຕາຄ່າໄຟຟ້າ
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="energyType" className="text-xs text-[var(--text-secondary)]">
                      {lo.ppa.fields.energyType} <span className="text-[#d4b37a]">*</span>
                    </Label>
                    <Select
                      value={formValues.energyType}
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  </div>

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
                </div>
              )}

              {/* Step 3: Timeline & Terms */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-[var(--border-subtle)] pb-3">
                    <h3 className="font-serif text-lg font-semibold text-[var(--text-strong)]">
                      {lo.ppa.wizard.step3}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      ວັນທີສຳຄັນ ແລະ ໄລຍະເວລາສັນຍາ
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="notes" className="text-xs text-[var(--text-secondary)]">
                      {lo.ppa.fields.notes}
                    </Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      {...register('notes')}
                      className="bg-[var(--surface-input)]"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Documents & Review */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-5">
                  <div className="border-b border-[var(--border-subtle)] pb-3">
                    <h3 className="font-serif text-lg font-semibold text-[var(--text-strong)]">
                      {lo.ppa.wizard.step4}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      ອັບໂຫຼດເອກະສານສັນຍາ ແລະ ກວດສອບຂໍ້ມູນຄັ້ງສຸດທ້າຍ
                    </p>
                  </div>

                  <FileDropzone onFilesSelected={handleFilesSelected} />
                  {uploadedFiles.length > 0 && (
                    <FileList
                      files={uploadedFiles}
                      onDelete={(f) => setUploadedFiles((prev) => prev.filter((x) => x.id !== f.id))}
                    />
                  )}

                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-300">
                    {lo.ppa.wizard.readyToSubmit}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{lo.ppa.actions.back}</span>
                </Button>

                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext} className="gap-2">
                    <span>{lo.ppa.actions.next}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    <Check className="h-4 w-4" />
                    <span>{isSubmitting ? lo.common.loading : lo.ppa.actions.finish}</span>
                  </Button>
                )}
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Right Live Summary Panel (Design.md §6) */}
        <div>
          <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-[rgba(212,179,122,0.25)] bg-gradient-to-b from-[#1e3a8a]/40 to-[#13294f]/30 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#d4b37a]" />
                <h4 className="font-serif text-sm font-semibold text-[var(--text-strong)]">
                  {lo.ppa.wizard.summaryTitle}
                </h4>
              </div>
              <span className="text-xs font-semibold tabular-nums text-[#d4b37a]">
                {progressPercent}%
              </span>
            </div>

            {/* Gold progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#b08a4a] to-[#d4b37a] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <dl className="flex flex-col gap-3 text-xs pt-2">
              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.contractNo}</dt>
                <dd className="font-medium tabular-nums text-[var(--text-strong)]">
                  {formValues.contractNo || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.projectName}</dt>
                <dd className="font-medium text-[var(--text-strong)]">
                  {formValues.projectName || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.developer}</dt>
                <dd className="font-medium text-[var(--text-strong)]">
                  {formValues.developerName || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.energyType}</dt>
                <dd className="font-medium text-[var(--ppa)]">
                  {lo.energy[formValues.energyType] ?? formValues.energyType}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.capacityMw}</dt>
                <dd className="font-medium tabular-nums text-[var(--text-strong)]">
                  {formValues.capacityMw ? `${formatNumber(Number(formValues.capacityMw))} MW` : '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.tariff}</dt>
                <dd className="font-medium tabular-nums text-[var(--text-strong)]">
                  {formValues.tariffUsCentPerKwh ? `${formValues.tariffUsCentPerKwh} US¢/kWh` : '—'}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.codDate}</dt>
                <dd className="font-medium tabular-nums text-[var(--text-strong)]">
                  {formatDate(formValues.codDate)}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.termYears}</dt>
                <dd className="font-medium tabular-nums text-[var(--text-strong)]">
                  {formValues.termYears ? `${formValues.termYears} ປີ` : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
